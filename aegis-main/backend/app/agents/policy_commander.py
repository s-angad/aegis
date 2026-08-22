"""
Agent 10: Policy Commander Agent
Suggests official emergency directives and action items, citing relevant standard operating procedures (SOPs)
and backing recommendations with visual reconnaissance telemetry.
"""
from typing import List, Tuple, Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine
    from ..recon.models import ReconObservation

from ..models.incident import Incident, Severity
from ..models.agent import AgentDecision, AgentName


class PolicyCommanderAgent:
    def __init__(self):
        self.name = AgentName.POLICY_COMMANDER

    def process(
        self,
        incidents: List[Incident],
        engine: "SimulationEngine",
        recon_obs: Optional["ReconObservation"] = None,
    ) -> Tuple[List[str], List[AgentDecision]]:
        decisions: List[AgentDecision] = []
        recommendations: List[str] = []

        disaster_type = getattr(engine, "disaster_type", "flood")
        tick = engine.tick

        # Check incidents
        active_incidents = [i for i in incidents if i.is_active]
        critical_incidents = [i for i in active_incidents if i.severity == Severity.CRITICAL]
        high_incidents = [i for i in active_incidents if i.severity == Severity.HIGH]

        # Check bridge statuses or other blockage situations
        bridges_failed = []
        for r in range(len(engine.city.grid)):
            for c in range(len(engine.city.grid[r])):
                cell = engine.city.grid[r][c]
                if cell.is_bridge and cell.bridge_failed:
                    bridges_failed.append(cell.sector_id)

        # Visual observation notes
        recon_note = ""
        if recon_obs and recon_obs.affected_cells:
            top_sectors = list({c.get("sector", "") for c in recon_obs.affected_cells if c.get("sector")})[:3]
            recon_note = f" [Visually Verified via CV Recon Frame #{recon_obs.frame_number}: {', '.join(top_sectors)} flooded at {recon_obs.flood_area_percent:.1f}% area]"

        # 1. Shelter policies
        active_shelters = [s for s in engine.shelters if s.status.value in ("active", "full")]
        if len(critical_incidents) > 0 and not active_shelters:
            recommendations.append(f"ACTIVATE: All standby Emergency Shelters immediately (SOP-005).{recon_note}")
        
        # 2. Rerouting / Road closures
        if bridges_failed:
            recommendations.append(f"CLOSE: All transport routes crossing failed structures in {', '.join(set(bridges_failed))} (SOP-004).")
        elif recon_obs and recon_obs.blocked_roads:
            blocked_sec = list(set(recon_obs.blocked_roads))[:2]
            recommendations.append(f"ROAD CLOSURE: Close inundated arterial segments in {', '.join(blocked_sec)} (SOP-004).")

        # 3. Dispatches and resource bottlenecks
        available_resources = engine.get_available_resources()
        if len(active_incidents) > len(engine.resources) * 0.7 and len(available_resources) == 0:
            recommendations.append("MUTUAL AID: Request auxiliary emergency response assets from neighboring municipalities (SOP-003).")

        # 4. Warnings and warning matrices (SOP-006)
        if len(critical_incidents) >= 2 or (recon_obs and recon_obs.expansion_rate > 3.0):
            recommendations.append(f"ALERT ESCALATION: Issue Tier-5 Broadcast Warning and initiate mandatory evacuation protocols (SOP-006).{recon_note}")
        elif len(high_incidents) >= 1:
            recommendations.append(f"ALERT ESCALATION: Issue Tier-3 Area Alerts via local SMS and sirens (SOP-006).")

        # Disaster-specific recommendations
        if disaster_type == "wildfire":
            recommendations.append("ENVIRONMENT: Deploy high-expansion foam units to establish defensive firebreaks (SOP-001).")
            recommendations.append("PUBLIC HEALTH: Recommend N95 mask usage and indoor sheltering for adjacent downwind sectors (SOP-006).")
        elif disaster_type == "cyclone":
            recommendations.append("EVACUATION: Enforce curfew in storm-surge inundation zones and shelter-in-place for stable structures (SOP-002).")
        else: # flood
            if any(c.flood_level > 2.0 for row in engine.city.grid for c in row):
                recommendations.append("RESCUE: Prioritize aerial helicopter extractions for trapped rooftop survivors (SOP-003).")

        # Fallback if everything is quiet
        if not recommendations:
            recommendations.append("MONITOR: Maintain standard operational status. Continue meteorological & visual tracking (SOP-001).")

        summary = "; ".join(recommendations[:3])
        decisions.append(AgentDecision(
            agent_name=AgentName.POLICY_COMMANDER,
            action="Policy Directives Formulated",
            description=f"Recommended actions: {summary}",
            reasoning=(
                f"Evaluated operational state & visual recon telemetry: {len(active_incidents)} active incidents, "
                f"{len(critical_incidents)} critical. "
                + (f"Aerial frame analysis: {recon_obs.flood_area_percent:.1f}% flooded area, expansion {recon_obs.expansion_rate:+.1f}%/s. " if recon_obs else "")
                + f"Directives formulated with SOP citations: {', '.join(recommendations)}."
            ),
            sop_reference="SOP-006" if critical_incidents else "SOP-001",
            severity="critical" if critical_incidents else ("warning" if high_incidents else "info")
        ))

        return recommendations, decisions
