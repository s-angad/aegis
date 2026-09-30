from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import ActionPlan, GPTOrchestratorOutput
from ..services.openai_service import openai_agent_service

ORCHESTRATOR_SYSTEM_PROMPT = """You are AEGIS FLOOD Orchestrator Agent.
You coordinate disaster-response decisions.
Inputs:
- PhysicalObservation
- Recon result
- Verifier result
- Predictor result
- available resources
- shelters
- operational constraints
Create a prioritized action plan.
Follow these rules:
1. Never act on unverified information.
2. Never invent casualties.
3. Never invent resources.
4. Never invent shelter capacity.
5. Never directly execute a physical action.
6. If there is no active flood, prefer monitoring / standby.
7. If risk increases, prioritize life safety.
8. Avoid unnecessary dispatch.
9. Explain why each action is recommended.
You answer WHAT should happen."""


class OrchestratorAgent(BaseAgent):
    name: str = "ORCHESTRATOR"
    version: str = "1.0.0"
    timeout_seconds: float = 30.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        obs = context.observation or {}
        obs_id = obs.get("observation_id", f"OBS-{context.frame_id}")
        recon_result = context.agent_results.get("RECON", {}).get("result", {})
        verifier_result = context.agent_results.get("VERIFIER", {}).get("result", {})
        predictor_result = context.agent_results.get("PREDICTOR", {}).get("result", {})

        affected_sectors = recon_result.get("affected_sectors", [])
        predicted_sectors = predictor_result.get("predicted_sectors", [])
        critical_sectors = recon_result.get("critical_sectors", [])

        # 1. REAL MODE: Attempt GPT-5.6 Luna Execution
        if openai_agent_service.is_available():
            gpt_payload = {
                "observation_id": obs_id,
                "frame_id": context.frame_id,
                "recon_result": recon_result,
                "verifier_result": verifier_result,
                "predictor_result": predictor_result,
                "available_resources": ["BOAT-01", "BOAT-02", "AMBULANCE-01", "TRAFFIC-UNIT-01"],
                "available_shelters": ["SHELTER-01", "SHELTER-02", "HOSPITAL-01"]
            }

            gpt_out, meta = await openai_agent_service.call_agent(
                agent_name=self.name,
                system_prompt=ORCHESTRATOR_SYSTEM_PROMPT,
                user_payload=gpt_payload,
                response_schema=GPTOrchestratorOutput,
                frame_id=context.frame_id,
                observation_id=obs_id
            )

            if gpt_out:
                res_dict = gpt_out.model_dump(mode="json")
                res_dict.update({
                    "agent": "orchestrator",
                    "status": "complete",
                    "priority": gpt_out.priority,
                    "action_plan_decision": gpt_out.decision,
                    "reasoning_summary": gpt_out.decision,
                    "actions": gpt_out.actions if gpt_out.actions else [{"action": "MONITOR", "reason": "No active flood"}],
                    "resources_requested": gpt_out.resources_required,
                    "confidence": gpt_out.confidence,
                    "_confidence": gpt_out.confidence,
                    "source": "GPT_5_6_LUNA",
                    "source_frame": context.frame_id,
                    "source_observation_id": obs_id,
                    "model": openai_agent_service.model,
                    "meta": meta
                })
                return res_dict

        # 2. SIMULATION MODE or API Fallback Execution
        priority = "CRITICAL" if critical_sectors or len(affected_sectors) > 4 else ("HIGH" if len(affected_sectors) > 0 else "NORMAL")

        objectives = [
            f"Contain flood expansion in sectors {', '.join(affected_sectors) if affected_sectors else 'none (surveillance active)'}.",
            "Maintain emergency access corridors across physical testbed grid.",
            "Prepare rescue assets for predicted high-risk sectors."
        ]

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
            actions=phase4b_actions,
            resources_requested=["BOAT-01"] if affected_sectors else [],
            sectors=affected_sectors,
            requires_approval=True,
            confidence=0.90,
            rationale=reasoning
        )

        output = action_plan.model_dump(mode="json")
        output.update({
            "agent": "orchestrator",
            "status": "complete",
            "priority": priority,
            "decision": reasoning,
            "actions": phase4b_actions,
            "reasoning_summary": reasoning,
            "source": "STRATEGIC_ORCHESTRATION",
            "source_frame": context.frame_id,
            "source_observation_id": obs_id,
            "model": "SIMULATION",
            "timestamp": context.timestamp,
            "confidence": 0.90,
            "_confidence": 0.90
        })
        return output
