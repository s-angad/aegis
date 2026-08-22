"""
Agent 3: Severity Assessment Agent
Calculates emergency severity using weighted multi-factor scoring, enhanced by visual recon metrics.
"""
from typing import List, Tuple, Optional, TYPE_CHECKING
import math

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine
    from ..recon.models import ReconObservation

from ..models.incident import Incident, Severity, IncidentType
from ..models.agent import AgentDecision, AgentName
from ..simulation.city import HOSPITAL_LOCATION

# Severity thresholds (composite score 0-100)
SEVERITY_THRESHOLDS = {
    Severity.CRITICAL: 75,
    Severity.HIGH: 50,
    Severity.MEDIUM: 25,
    Severity.LOW: 0,
}

# Weights for each factor (must sum to 1.0)
WEIGHTS = {
    "water_level": 0.25,
    "population_density": 0.20,
    "hospital_proximity": 0.15,
    "vulnerable_population": 0.15,
    "infrastructure_risk": 0.15,
    "recon_expansion": 0.10,
}


def _water_level_score(flood_level: float) -> float:
    if flood_level <= 0:
        return 0
    if flood_level >= 3.0:
        return 100
    return min(100, (flood_level / 3.0) * 100)


def _population_score(pop_density: int) -> float:
    return min(100, (pop_density / 1000) * 100)


def _hospital_proximity_score(lat: float, lng: float, city) -> float:
    hosp_cell = city.get_cell(HOSPITAL_LOCATION["row"], HOSPITAL_LOCATION["col"])
    if not hosp_cell:
        return 50.0
    dist = math.sqrt((lat - hosp_cell.center_lat) ** 2 + (lng - hosp_cell.center_lng) ** 2)
    proximity = max(0, 1.0 - (dist / 0.05))
    return proximity * 100


def _vulnerable_pop_score(incident: Incident) -> float:
    vulnerable_keywords = ["elderly", "child", "pregnant", "disabled", "old woman", "infant", "senior"]
    desc = incident.description.lower()
    matches = sum(1 for k in vulnerable_keywords if k in desc)
    return min(100, matches * 35)


def _infrastructure_risk_score(incident: Incident, engine: "SimulationEngine") -> float:
    blocked = engine.city.get_blocked_cells()
    sector_cells = engine.city.get_sector_cells(incident.sector)
    blocked_in_sector = sum(1 for c in blocked if c.sector_id == incident.sector)
    total_sector = max(1, len(sector_cells))
    block_ratio = blocked_in_sector / total_sector
    return min(100, block_ratio * 150)


def _score_to_severity(score: float, incident_type: IncidentType) -> Severity:
    boost = 15 if incident_type in (IncidentType.MEDICAL_EMERGENCY, IncidentType.EVACUATION_NEEDED) else 0
    adjusted = min(100, score + boost)
    if adjusted >= SEVERITY_THRESHOLDS[Severity.CRITICAL]:
        return Severity.CRITICAL
    if adjusted >= SEVERITY_THRESHOLDS[Severity.HIGH]:
        return Severity.HIGH
    if adjusted >= SEVERITY_THRESHOLDS[Severity.MEDIUM]:
        return Severity.MEDIUM
    return Severity.LOW


class SeverityAgent:
    def __init__(self):
        self.name = AgentName.SEVERITY

    def process(
        self,
        incidents: List[Incident],
        engine: "SimulationEngine",
        recon_obs: Optional["ReconObservation"] = None,
    ) -> Tuple[List[Incident], List[AgentDecision]]:
        decisions: List[AgentDecision] = []
        critical_count = 0
        high_count = 0

        # Calculate recon expansion & velocity impact score
        recon_score = 0.0
        if recon_obs:
            expansion_impact = max(0.0, recon_obs.expansion_rate * 25.0)
            velocity_impact = max(0.0, recon_obs.estimated_velocity * 30.0)
            recon_score = min(100.0, expansion_impact + velocity_impact)

        for incident in incidents:
            sector_cells = engine.city.get_sector_cells(incident.sector)
            max_flood = max((c.flood_level for c in sector_cells), default=0.0)
            avg_pop = sum(c.population_density for c in sector_cells) / max(1, len(sector_cells))

            scores = {
                "water_level": _water_level_score(max_flood),
                "population_density": _population_score(avg_pop),
                "hospital_proximity": _hospital_proximity_score(incident.lat, incident.lng, engine.city),
                "vulnerable_population": _vulnerable_pop_score(incident),
                "infrastructure_risk": _infrastructure_risk_score(incident, engine),
                "recon_expansion": recon_score,
            }

            composite = sum(scores[k] * WEIGHTS[k] for k in scores)
            incident.severity = _score_to_severity(composite, incident.type)
            incident.population_affected = int(avg_pop * len(sector_cells))

            if incident.severity == Severity.CRITICAL:
                critical_count += 1
            elif incident.severity == Severity.HIGH:
                high_count += 1

        if incidents:
            severity_breakdown = {
                "CRITICAL": sum(1 for i in incidents if i.severity == Severity.CRITICAL),
                "HIGH": sum(1 for i in incidents if i.severity == Severity.HIGH),
                "MEDIUM": sum(1 for i in incidents if i.severity == Severity.MEDIUM),
                "LOW": sum(1 for i in incidents if i.severity == Severity.LOW),
            }
            top = max(incidents, key=lambda i: list(Severity).index(i.severity) if i.severity in list(Severity) else 0, default=None)
            
            recon_note = f" (CV Recon expansion rate: {recon_obs.expansion_rate:+.1f}%/s, vel: {recon_obs.estimated_velocity:.2f}m/s)" if recon_obs else ""
            
            decisions.append(AgentDecision(
                agent_name=AgentName.SEVERITY,
                action="Severity Assessment Complete",
                description=f"{critical_count} CRITICAL, {high_count} HIGH severity incidents identified",
                reasoning=(
                    f"Applied 6-factor weighted severity model (water: 25%, pop: 20%, hospital: 15%, "
                    f"vulnerable: 15%, infra: 15%, recon expansion/velocity: 10%){recon_note}. "
                    f"Breakdown: {severity_breakdown}. "
                    + (f"Most critical: {top.sector} — {top.type.value}" if top else "")
                ),
                sop_reference="SOP-001",
                severity="critical" if critical_count > 0 else ("warning" if high_count > 0 else "info"),
            ))

        return incidents, decisions
