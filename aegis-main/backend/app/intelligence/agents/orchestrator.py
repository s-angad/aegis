"""
AEGIS FLOOD v2.0 - Orchestrator Agent Implementation (Phase 4A)
Formulates recommended ActionPlan based on Recon, Verifier, and Predictor inputs.
IMPORTANT: Recommendation only - does NOT directly execute real-world actions.
"""
from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import ActionPlan


class OrchestratorAgent(BaseAgent):
    name: str = "ORCHESTRATOR"
    version: str = "1.0.0"
    timeout_seconds: float = 5.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        recon_result = context.agent_results.get("RECON", {}).get("result", {})
        predictor_result = context.agent_results.get("PREDICTOR", {}).get("result", {})

        affected_sectors = recon_result.get("affected_sectors", [])
        predicted_sectors = predictor_result.get("predicted_sectors", [])
        critical_sectors = recon_result.get("critical_sectors", [])

        priority = "CRITICAL" if critical_sectors or len(affected_sectors) > 4 else ("HIGH" if len(affected_sectors) > 0 else "NORMAL")

        objectives = [
            f"Contain flood expansion in sectors {', '.join(affected_sectors) if affected_sectors else 'none (surveillance active)'}.",
            "Maintain emergency access corridors across physical testbed grid.",
            "Prepare rescue assets for predicted high-risk sectors."
        ]

        actions = []
        resources_requested = []

        if "S6" in affected_sectors:
            actions.append({
                "action_id": "ACT-001",
                "type": "EVACUATE_HOSPITAL_PERIMETER",
                "target_sector": "S6",
                "description": "Deploy rescue team to protect HOSPITAL-01 boundary in S6"
            })
            resources_requested.append("RESCUE_BOAT_UNIT_01")

        if "S7" in affected_sectors:
            actions.append({
                "action_id": "ACT-002",
                "type": "MONITOR_BRIDGE_INTEGRITY",
                "target_sector": "S7",
                "description": "Inspect CENTRAL_BRIDGE-01 status and divert traffic to arterial detour"
            })
            resources_requested.append("TRAFFIC_CONTROL_UNIT_02")

        if not actions:
            actions.append({
                "action_id": "ACT-000",
                "type": "ROUTINE_MONITORING",
                "target_sector": "S1-S16",
                "description": "Continue 5-second aerial drone reconnaissance stream"
            })

        rationale = (
            f"Formulated recommended action plan for incident {context.incident_id} (Frame {context.frame_id}). "
            f"Prioritizes active containment across {len(affected_sectors)} affected sectors and {len(predicted_sectors)} predicted surge sectors."
        )

        o_confidence = 0.90

        if not affected_sectors:
            phase4b_actions = [
                {"action": "MONITOR", "reason": "No active flooding detected."}
            ]
            reasoning = "No active flooding detected across physical testbed model. Continuing routine surveillance."
        else:
            phase4b_actions = []
            for s in affected_sectors:
                phase4b_actions.append({"action": "EVACUATE", "sector": s})
                phase4b_actions.append({"action": "ALLOCATE_BOAT", "resource": "BOAT-01", "sector": s})
            reasoning = f"Active flood detected in sectors {', '.join(affected_sectors)} with predicted spread toward {', '.join(predicted_sectors) if predicted_sectors else 'downstream sectors'}."

        action_plan = ActionPlan(
            priority=priority,
            situation=f"Flood hazard status: {priority} (affected: {', '.join(affected_sectors) if affected_sectors else 'none'})",
            objectives=objectives,
            actions=actions,
            resources_requested=resources_requested,
            sectors=affected_sectors,
            requires_approval=True,
            confidence=o_confidence,
            rationale=rationale
        )

        output = action_plan.model_dump(mode="json")
        output.update({
            "agent": "orchestrator",
            "status": "complete",
            "source": "STRATEGIC_ORCHESTRATION",
            "source_frame": context.frame_id,
            "timestamp": context.timestamp,
            "priority": priority,
            "actions": phase4b_actions,
            "reasoning_summary": reasoning,
            "confidence": o_confidence,
            "_confidence": o_confidence
        })
        return output
