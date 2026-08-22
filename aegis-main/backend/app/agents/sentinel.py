"""
Agent 1: Sentinel Agent
Monitors incoming data streams and produces structured Incident objects.
"""
from datetime import datetime
from typing import List, TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine

from ..models.incident import Incident, RawReport, IncidentType, IncidentSource, Severity
from ..models.agent import AgentDecision, AgentName


FLOOD_KEYWORDS = ["water", "flood", "rising", "submerge", "overflow", "wave", "rain"]
MEDICAL_KEYWORDS = ["ambulance", "medical", "injured", "collapsed", "heart", "pregnant", "hospital"]
STRUCTURAL_KEYWORDS = ["crack", "collapse", "wall", "foundation", "bridge", "structure"]
EVACUATION_KEYWORDS = ["trapped", "stranded", "rooftop", "evacuate", "escape"]


def _classify_incident(report: RawReport) -> IncidentType:
    msg = report.message.lower()
    if any(k in msg for k in MEDICAL_KEYWORDS):
        return IncidentType.MEDICAL_EMERGENCY
    if any(k in msg for k in STRUCTURAL_KEYWORDS):
        return IncidentType.STRUCTURAL_DAMAGE
    if any(k in msg for k in EVACUATION_KEYWORDS):
        return IncidentType.EVACUATION_NEEDED
    return IncidentType.FLOOD


def _estimate_confidence(report: RawReport) -> int:
    """Base confidence from source type."""
    base = {
        IncidentSource.EMERGENCY_CALL: 80,
        IncidentSource.SENSOR: 90,
        IncidentSource.CITIZEN_REPORT: 65,
        IncidentSource.SOCIAL_MEDIA: 50,
        IncidentSource.WEATHER_FEED: 85,
    }.get(report.source, 60)
    # False reports get lower confidence
    if report.is_false:
        base -= 30
    return max(10, min(95, base))


class SentinelAgent:
    def __init__(self):
        self.name = AgentName.SENTINEL
        self.processed_report_ids: set = set()

    def process(self, engine: "SimulationEngine") -> tuple[List[Incident], List[AgentDecision]]:
        """
        Process raw reports into structured incidents.
        Returns (new_incidents, decisions).
        """
        decisions: List[AgentDecision] = []
        new_incidents: List[Incident] = []

        # Get unprocessed reports
        new_reports = [r for r in engine.raw_reports if r.id not in self.processed_report_ids]
        if not new_reports:
            return new_incidents, decisions

        for report in new_reports:
            self.processed_report_ids.add(report.id)
            incident_type = _classify_incident(report)
            confidence = _estimate_confidence(report)

            # Get water level from city cell
            cell = engine.city.get_cell(
                int((report.lat - (engine.city.grid[0][0].lat - 0.002)) / -0.0045) % 16,
                int((report.lng - engine.city.grid[0][0].lng) / 0.0051) % 16,
            )
            water_level = cell.flood_level if cell else 0.0

            incident = Incident(
                id=str(uuid.uuid4())[:8],
                type=incident_type,
                sector=report.sector,
                lat=report.lat,
                lng=report.lng,
                severity=Severity.MEDIUM,  # Will be updated by Severity Agent
                confidence=confidence,
                source=report.source,
                description=report.message[:200],
                timestamp=report.timestamp,
                verified=False,
                reporter_name=report.reporter_name,
                water_level=water_level,
            )
            new_incidents.append(incident)

        if new_incidents:
            decisions.append(AgentDecision(
                agent_name=AgentName.SENTINEL,
                action="Incidents Detected",
                description=f"Processed {len(new_reports)} reports → {len(new_incidents)} raw incidents",
                reasoning=f"Classified {sum(1 for i in new_incidents if i.type == IncidentType.FLOOD)} flood, "
                           f"{sum(1 for i in new_incidents if i.type == IncidentType.MEDICAL_EMERGENCY)} medical, "
                           f"{sum(1 for i in new_incidents if i.type == IncidentType.EVACUATION_NEEDED)} evacuation incidents "
                           f"from incoming data streams. Confidence range: "
                           f"{min(i.confidence for i in new_incidents)}-{max(i.confidence for i in new_incidents)}%",
                sop_reference=None,
                severity="info",
            ))

        return new_incidents, decisions
