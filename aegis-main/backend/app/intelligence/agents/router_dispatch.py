from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import DispatchPlan, GPTRouterDispatchOutput
from ..services.openai_service import openai_agent_service

ROUTER_SYSTEM_PROMPT = """You are AEGIS FLOOD Router & Dispatch Agent.
Your responsibility is operational routing.
You answer: HOW should the approved response action be executed?
You must use the provided network topology and resource state.
Do not invent roads.
Do not invent resources.
Do not dispatch anything unless an action is justified.
If the Orchestrator recommends STANDBY, return DISPATCH_STATUS = STANDBY.
For emergency routes:
- avoid blocked roads
- avoid failed bridges
- prefer valid connected routes
- identify resource
- identify destination
- provide route
You NEVER directly execute a real-world dispatch."""


class RouterDispatchAgent(BaseAgent):
    name: str = "ROUTER_DISPATCH"
    version: str = "1.0.0"
    timeout_seconds: float = 30.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        obs = context.observation or {}
        obs_id = obs.get("observation_id", f"OBS-{context.frame_id}")
        recon_result = context.agent_results.get("RECON", {}).get("result", {})
        orchestrator_result = context.agent_results.get("ORCHESTRATOR", {}).get("result", {})

        affected_infra = recon_result.get("affected_infrastructure", [])
        blocked_roads = [infra.replace("ROAD:", "") for infra in affected_infra if infra.startswith("ROAD:")]

        # 1. REAL MODE: Attempt GPT-5.6 Luna Execution
        if openai_agent_service.is_available():
            gpt_payload = {
                "observation_id": obs_id,
                "frame_id": context.frame_id,
                "recon_result": recon_result,
                "orchestrator_result": orchestrator_result,
                "blocked_roads": blocked_roads,
                "bridge_status": recon_result.get("bridge_status", "OPEN"),
                "network_graph": "S1-S16 grid network with central river bridge S7"
            }

            gpt_out, meta = await openai_agent_service.call_agent(
                agent_name=self.name,
                system_prompt=ROUTER_SYSTEM_PROMPT,
                user_payload=gpt_payload,
                response_schema=GPTRouterDispatchOutput,
                frame_id=context.frame_id,
                observation_id=obs_id
            )

            if gpt_out:
                res_dict = gpt_out.model_dump(mode="json")
                res_dict.update({
                    "agent": "router_dispatch",
                    "status": "complete",
                    "dispatch_status": gpt_out.dispatch_status,
                    "network_status": "CLEAR" if gpt_out.dispatch_status == "STANDBY" else "DISPATCHED",
                    "blocked_roads": gpt_out.blocked_reasons if gpt_out.blocked_reasons else blocked_roads,
                    "routes": gpt_out.routes,
                    "dispatches": gpt_out.routes,
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
        orch_priority = orchestrator_result.get("priority", "NORMAL")
        actions = orchestrator_result.get("actions", [])

        if orch_priority in ["NORMAL", "STANDBY"] or not actions:
            status_val = "STANDBY"
            net_status = "CLEAR"
            phase4b_routes = []
            phase4b_dispatches = []
            blocked_roads_out = []
        else:
            status_val = "READY"
            net_status = "DISPATCHED"
            phase4b_routes = [
                {
                    "resource": "BOAT-01",
                    "from": "BASE-HQ",
                    "to": act.get("sector", "S6"),
                    "route": ["R01", act.get("sector", "S6")]
                }
                for act in actions if act.get("action") != "MONITOR"
            ]
            phase4b_dispatches = [
                {
                    "resource": "BOAT-01",
                    "destination": act.get("sector", "S6"),
                    "priority": orch_priority
                }
                for act in actions if act.get("action") != "MONITOR"
            ]
            blocked_roads_out = blocked_roads

        dispatch_plan = DispatchPlan(
            dispatches=phase4b_dispatches,
            routes=phase4b_routes,
            blocked_roads=blocked_roads_out,
            confidence=0.88
        )

        output = dispatch_plan.model_dump(mode="json")
        output.update({
            "agent": "router_dispatch",
            "status": "complete",
            "dispatch_status": status_val,
            "network_status": net_status,
            "blocked_roads": blocked_roads_out,
            "routes": phase4b_routes,
            "dispatches": phase4b_dispatches,
            "source": "ROUTING_AND_DISPATCH",
            "source_frame": context.frame_id,
            "source_observation_id": obs_id,
            "model": "SIMULATION",
            "timestamp": context.timestamp,
            "confidence": 0.88,
            "_confidence": 0.88
        })
        return output
