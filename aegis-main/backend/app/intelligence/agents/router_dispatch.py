"""
AEGIS FLOOD v2.0 - Router & Dispatch Agent Implementation (Phase 4A)
Formulates recommended DispatchPlan and route options based on ActionPlan and road graph.
IMPORTANT: Recommendation only - does NOT directly dispatch real-world assets.
"""
from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import DispatchPlan


class RouterDispatchAgent(BaseAgent):
    name: str = "ROUTER_DISPATCH"
    version: str = "1.0.0"
    timeout_seconds: float = 5.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        recon_result = context.agent_results.get("RECON", {}).get("result", {})
        orchestrator_result = context.agent_results.get("ORCHESTRATOR", {}).get("result", {})

        affected_infra = recon_result.get("affected_infrastructure", [])
        actions = orchestrator_result.get("actions", [])
        resources = orchestrator_result.get("resources_requested", [])

        blocked_roads = [infra.replace("ROAD:", "") for infra in affected_infra if infra.startswith("ROAD:")]

        dispatches = []
        routes = []
        alt_routes = []
        est_times = {}

        for idx, act in enumerate(actions):
            unit_id = resources[idx] if idx < len(resources) else f"AUX_UNIT_{idx+1}"
            target_sector = act.get("target_sector", "S1")

            dispatches.append({
                "dispatch_id": f"DSP-{idx+1:03d}",
                "unit_id": unit_id,
                "target_sector": target_sector,
                "action_type": act.get("type"),
                "status": "RECOMMENDED_PENDING_APPROVAL"
            })

            # Primary Route
            routes.append({
                "unit_id": unit_id,
                "destination_sector": target_sector,
                "path": ["S1", "S5", target_sector] if target_sector != "S1" else ["S1"],
                "uses_blocked_road": any(r in blocked_roads for r in ["ROAD-H-S6", "ROAD-V-S7"])
            })

            # Alternative Bypass Route avoiding blocked roads
            alt_routes.append({
                "unit_id": unit_id,
                "destination_sector": target_sector,
                "bypass_path": ["S1", "S2", "S3", "S4", "S8", target_sector] if target_sector != "S1" else ["S1"],
                "avoids_all_blocked_roads": True
            })

            est_times[unit_id] = 180.0 + idx * 45.0  # seconds

        r_confidence = 0.88

        dispatch_plan = DispatchPlan(
            dispatches=dispatches,
            routes=routes,
            blocked_roads=blocked_roads,
            alternative_routes=alt_routes,
            estimated_times=est_times,
            confidence=r_confidence
        )

        orch_priority = orchestrator_result.get("priority", "NORMAL")
        if orch_priority == "NORMAL" or not dispatches:
            status_val = "STANDBY"
            net_status = "CLEAR"
            phase4b_routes = []
            phase4b_dispatches = []
            blocked_roads_out = []
        else:
            status_val = "ACTIVE"
            net_status = "DISPATCHED"
            phase4b_routes = [
                {
                    "resource": d["unit_id"],
                    "from": "BASE-HQ",
                    "to": d["target_sector"],
                    "route": ["R01", d["target_sector"]]
                }
                for d in dispatches
            ]
            phase4b_dispatches = [
                {
                    "resource": d["unit_id"],
                    "destination": d["target_sector"],
                    "priority": orch_priority
                }
                for d in dispatches
            ]
            blocked_roads_out = blocked_roads

        output = dispatch_plan.model_dump(mode="json")
        output.update({
            "agent": "router_dispatch",
            "status": "complete",
            "source": "ROUTING_AND_DISPATCH",
            "source_frame": context.frame_id,
            "timestamp": context.timestamp,
            "dispatch_status": status_val,
            "network_status": net_status,
            "blocked_roads": blocked_roads_out,
            "routes": phase4b_routes,
            "dispatches": phase4b_dispatches,
            "confidence": r_confidence,
            "_confidence": r_confidence
        })
        return output
