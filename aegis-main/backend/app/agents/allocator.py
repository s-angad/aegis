"""
Agent 5: Resource Allocation Agent
Optimally assigns available resources to incidents based on priority and proximity.
"""
from typing import List, Tuple, Dict, TYPE_CHECKING
import math

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine

from ..models.incident import Incident, Severity, IncidentType
from ..models.resource import Resource, ResourceType, ResourceStatus
from ..models.agent import AgentDecision, AgentName

# Priority score by severity
SEVERITY_SCORE = {
    Severity.CRITICAL: 100,
    Severity.HIGH: 70,
    Severity.MEDIUM: 40,
    Severity.LOW: 15,
}

# Best resource type for incident type
PREFERRED_RESOURCES = {
    IncidentType.FLOOD: [ResourceType.RESCUE_BOAT, ResourceType.HELICOPTER, ResourceType.WATER_PUMP, ResourceType.RESCUE_TEAM],
    IncidentType.MEDICAL_EMERGENCY: [ResourceType.AMBULANCE, ResourceType.HELICOPTER],
    IncidentType.EVACUATION_NEEDED: [ResourceType.RESCUE_BOAT, ResourceType.HELICOPTER, ResourceType.RELIEF_TEAM, ResourceType.NGO_VOLUNTEER],
    IncidentType.STRUCTURAL_DAMAGE: [ResourceType.RESCUE_TEAM, ResourceType.WATER_PUMP, ResourceType.AMBULANCE],
    IncidentType.ROAD_BLOCKED: [ResourceType.RESCUE_TEAM, ResourceType.WATER_PUMP],
}


def _geo_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Approximate distance in km."""
    dlat = (lat2 - lat1) * 111.0
    dlng = (lng2 - lng1) * 111.0 * math.cos(math.radians((lat1 + lat2) / 2))
    return math.sqrt(dlat ** 2 + dlng ** 2)


def _priority_score(incident: Incident) -> float:
    base = SEVERITY_SCORE.get(incident.severity, 0)
    # Boost for medical emergencies
    if incident.type == IncidentType.MEDICAL_EMERGENCY:
        base += 20
    # Boost for unassigned
    if not incident.assigned_resources:
        base += 10
    return base


class AllocationAgent:
    def __init__(self):
        self.name = AgentName.ALLOCATOR

    def process(
        self,
        incidents: List[Incident],
        engine: "SimulationEngine",
    ) -> Tuple[List[Incident], List[AgentDecision]]:
        decisions: List[AgentDecision] = []
        dispatched = []

        # Sort incidents by priority (highest first)
        unassigned = [i for i in incidents if not i.assigned_resources and i.severity in (Severity.CRITICAL, Severity.HIGH)]
        unassigned.sort(key=_priority_score, reverse=True)

        available = engine.get_available_resources()

        for incident in unassigned:
            if not available:
                break

            preferred_types = PREFERRED_RESOURCES.get(incident.type, [ResourceType.RESCUE_TEAM])

            # Find best available resource
            best_resource = None
            best_score = float("inf")

            for res in available:
                dist = _geo_distance(res.lat, res.lng, incident.lat, incident.lng)
                type_penalty = 0 if res.type in preferred_types else 2.0
                score = dist + type_penalty
                if score < best_score:
                    best_score = score
                    best_resource = res

            if best_resource:
                # Dispatch
                best_resource.status = ResourceStatus.EN_ROUTE
                best_resource.assigned_incident = incident.id
                incident.assigned_resources.append(best_resource.id)
                available.remove(best_resource)

                dispatched.append({
                    "resource": best_resource.name,
                    "resource_type": best_resource.type.value,
                    "incident": incident.sector,
                    "severity": incident.severity.value,
                    "distance_km": round(best_score, 2),
                })

        # For resources EN_ROUTE/ON_SCENE - simulate movement progress
        for res in engine.resources:
            if res.status == ResourceStatus.EN_ROUTE:
                res.route_progress = min(1.0, res.route_progress + 0.25)
                if res.route_progress >= 1.0:
                    res.status = ResourceStatus.ON_SCENE
                    # Move resource to incident location
                    assigned_inc = next((i for i in incidents if i.id == res.assigned_incident), None)
                    if assigned_inc:
                        res.lat = assigned_inc.lat + 0.0002
                        res.lng = assigned_inc.lng + 0.0002
            elif res.status == ResourceStatus.ON_SCENE:
                # After 2 more ticks, mark as returning
                res.route_progress = min(2.0, res.route_progress + 0.25)
                if res.route_progress >= 2.0:
                    res.status = ResourceStatus.RETURNING
                    # Route resource home
                    res.route_progress = 0.0
                    res.assigned_incident = None
            elif res.status == ResourceStatus.RETURNING:
                res.route_progress = min(1.0, res.route_progress + 0.35)
                if res.route_progress >= 1.0:
                    res.status = ResourceStatus.AVAILABLE
                    res.lat = res.home_lat
                    res.lng = res.home_lng
                    res.route_progress = 0.0

        if dispatched:
            dispatch_summary = ", ".join(f"{d['resource']} → {d['incident']}" for d in dispatched[:3])
            decisions.append(AgentDecision(
                agent_name=AgentName.ALLOCATOR,
                action=f"Resources Dispatched",
                description=f"Dispatched {len(dispatched)} resource(s): {dispatch_summary}",
                reasoning=(
                    f"Sorted {len(unassigned)} unassigned incidents by priority score (severity + type bonus). "
                    f"Applied nearest-available-preferred-type matching. "
                    f"Dispatched: {[d['resource'] + ' to ' + d['incident'] for d in dispatched]}. "
                    f"{len(engine.get_available_resources())} resources remain available."
                ),
                sop_reference="SOP-003",
                severity="warning" if dispatched else "info",
            ))
        elif unassigned:
            decisions.append(AgentDecision(
                agent_name=AgentName.ALLOCATOR,
                action="Resource Shortage",
                description=f"⚠ {len(unassigned)} incidents unassigned — all resources deployed",
                reasoning=f"All available resources are deployed. {len(unassigned)} HIGH/CRITICAL incidents awaiting resources. Requesting additional units.",
                sop_reference="SOP-003",
                severity="critical",
            ))

        return incidents, decisions
