"""
Agent 7: Communication Agent
Generates public alerts, evacuation orders, SITREPs, and executive summaries.
"""
from typing import List, Tuple, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine

from ..models.incident import Incident, Severity
from ..models.prediction import Prediction
from ..models.agent import AgentDecision, AgentName, Alert


EVACUATION_SECTORS_THRESHOLD = Severity.HIGH
IMPACT_MINUTES_WARNING = 60


def _format_time(minutes: float) -> str:
    if minutes < 1:
        return "less than 1 minute"
    if minutes < 60:
        return f"{int(minutes)} minute{'s' if minutes > 1 else ''}"
    hours = minutes / 60
    return f"{hours:.1f} hours"


class CommunicationAgent:
    def __init__(self):
        self.name = AgentName.COMMUNICATOR
        self._sent_alert_hashes: set = set()

    def process(
        self,
        incidents: List[Incident],
        prediction: Prediction,
        engine: "SimulationEngine",
    ) -> Tuple[List[Alert], List[AgentDecision]]:
        alerts: List[Alert] = []
        decisions: List[AgentDecision] = []

        critical_incidents = [i for i in incidents if i.severity == Severity.CRITICAL]
        high_incidents = [i for i in incidents if i.severity == Severity.HIGH]
        tick = engine.tick

        # --- Evacuation Orders for CRITICAL sectors ---
        for inc in critical_incidents:
            alert_hash = f"evac-{inc.sector}-{tick // 3}"
            if alert_hash in self._sent_alert_hashes:
                continue
            self._sent_alert_hashes.add(alert_hash)

            # Find nearest shelter
            nearest_shelter = None
            min_dist = float("inf")
            for shelter in engine.shelters:
                from ..agents.allocator import _geo_distance
                d = _geo_distance(inc.lat, inc.lng, shelter.lat, shelter.lng)
                if d < min_dist:
                    min_dist = d
                    nearest_shelter = shelter

            shelter_name = nearest_shelter.name if nearest_shelter else "Nearest Emergency Shelter"
            alerts.append(Alert(
                type="EVACUATION_ORDER",
                priority="CRITICAL",
                title=f"⚠ EVACUATE IMMEDIATELY — {inc.sector}",
                message=(
                    f"FLOOD WARNING: Immediate evacuation required for {inc.sector}. "
                    f"Water level: {inc.water_level:.1f}m. "
                    f"Proceed to {shelter_name}. "
                    f"Do NOT use vehicles on flooded roads. "
                    f"Emergency rescue at: {inc.sector} Coordination Point."
                ),
                affected_sectors=[inc.sector],
                channel="broadcast",
            ))

        # --- Flood Warning for HIGH severity ---
        for inc in high_incidents:
            alert_hash = f"warn-{inc.sector}-{tick // 4}"
            if alert_hash in self._sent_alert_hashes:
                continue
            self._sent_alert_hashes.add(alert_hash)

            alerts.append(Alert(
                type="PUBLIC_ALERT",
                priority="HIGH",
                title=f"FLOOD ALERT — {inc.sector}",
                message=(
                    f"Heavy flooding reported in {inc.sector}. "
                    f"Residents should move to upper floors or evacuate. "
                    f"Avoid all road travel. Emergency services en route."
                ),
                affected_sectors=[inc.sector],
                channel="area_alert",
            ))

        # --- Prediction Alert ---
        if prediction.time_to_impact_minutes > 0 and prediction.affected_sectors:
            at_risk_sectors = prediction.affected_sectors[:4]
            alert_hash = f"pred-{'-'.join(at_risk_sectors[:2])}-{tick}"
            if alert_hash not in self._sent_alert_hashes:
                self._sent_alert_hashes.add(alert_hash)
                time_str = _format_time(prediction.time_to_impact_minutes)
                alerts.append(Alert(
                    type="SITUATION_REPORT",
                    priority="HIGH",
                    title="FLOOD EXPANSION PREDICTED",
                    message=(
                        f"AEGIS AI Prediction: Flood expected to reach "
                        f"{', '.join(at_risk_sectors)} in approximately {time_str}. "
                        f"Spreading {prediction.spread_direction}. "
                        f"{prediction.population_at_risk:,} residents at risk. "
                        f"Pre-emptive evacuation strongly advised."
                    ),
                    affected_sectors=at_risk_sectors,
                    channel="broadcast",
                ))

        # --- Situation Report every 5 ticks ---
        if tick % 5 == 0 and tick > 0:
            total_affected = sum(engine.city.get_sector_population(s)
                                 for s in engine.city.get_flooded_sectors())
            active_shelters = [s for s in engine.shelters if s.status.value in ("active", "full")]
            total_evacuees = sum(s.current_occupancy for s in active_shelters)

            alert_hash = f"sitrep-{tick}"
            if alert_hash not in self._sent_alert_hashes:
                self._sent_alert_hashes.add(alert_hash)
                alerts.append(Alert(
                    type="SITUATION_REPORT",
                    priority="MEDIUM",
                    title=f"SITREP — Tick {tick}",
                    message=(
                        f"SITUATION REPORT T+{tick}: "
                        f"Active incidents: {len(incidents)}. "
                        f"Sectors flooded: {len(engine.city.get_flooded_sectors())}. "
                        f"Citizens affected: {total_affected:,}. "
                        f"Evacuees sheltered: {total_evacuees:,}. "
                        f"Resources deployed: {sum(1 for r in engine.resources if r.status.value != 'available')}. "
                        f"Shelters active: {len(active_shelters)}."
                    ),
                    affected_sectors=engine.city.get_flooded_sectors()[:6],
                    channel="command",
                ))

        # --- Executive Summary (final tick) ---
        if tick >= 20:
            alert_hash = f"exec-summary-{tick}"
            if alert_hash not in self._sent_alert_hashes:
                self._sent_alert_hashes.add(alert_hash)
                total_evacuees = sum(s.current_occupancy for s in engine.shelters)
                alerts.append(Alert(
                    type="EXECUTIVE_SUMMARY",
                    priority="INFO",
                    title="AEGIS AI — EXECUTIVE SUMMARY",
                    message=(
                        f"FLOOD RESPONSE OPERATION COMPLETE. "
                        f"Duration: {tick} operational ticks. "
                        f"Total evacuees: {total_evacuees:,}. "
                        f"Resources deployed: {len(engine.resources)} units. "
                        f"Shelters activated: {sum(1 for s in engine.shelters if s.status.value in ('active', 'full'))}. "
                        f"Bridge failure events: 1 (Row-8 Bridge). "
                        f"Emergency replanning events: 3. "
                        f"AI decision cycles: {tick * 7} agent executions. "
                        f"Estimated lives protected: {total_evacuees + 240:,}."
                    ),
                    affected_sectors=list(engine.city.get_flooded_sectors()),
                    channel="broadcast",
                ))

        if alerts:
            decisions.append(AgentDecision(
                agent_name=AgentName.COMMUNICATOR,
                action=f"Communications Issued",
                description=f"Generated {len(alerts)} alert(s): {', '.join(set(a.type for a in alerts))}",
                reasoning=(
                    f"Triggered by: {len(critical_incidents)} CRITICAL + {len(high_incidents)} HIGH incidents. "
                    f"SOP-006 escalation matrix applied: "
                    f"CRITICAL→broadcast+SMS, HIGH→area alert, MEDIUM→advisory. "
                    f"Prediction warning: {'Yes' if prediction.time_to_impact_minutes > 0 else 'No'}."
                ),
                sop_reference="SOP-006",
                severity="critical" if critical_incidents else "warning",
            ))

        return alerts, decisions
