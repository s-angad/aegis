"""
AEGIS FLOOD v2.0 - OODA Engine Pipeline Manager (Phase 4A)
Coordinates dependency execution of the 5 specialized agents with failure isolation,
event publishing, WebSocket status updates, and idempotency checks.
"""
from typing import Dict, List, Any, Optional
import asyncio
import logging
import time

from .registry import agent_registry, AgentRegistry
from .state import intelligence_state_manager, IntelligenceStateManager
from .events import event_bus, EventBus, IntelligenceEvent, EventTypes
from ..schemas.context import AgentContext
from ..schemas.results import AgentResult, AgentStatus
from ..schemas.frame_state import frame_tracker, FrameState

logger = logging.getLogger("aegis-ooda-engine")

DEFAULT_PIPELINE_ORDER = [
    "RECON",
    "VERIFIER",
    "PREDICTOR",
    "ORCHESTRATOR",
    "ROUTER_DISPATCH"
]

STATE_MAP = {
    "RECON": FrameState.RECON_COMPLETE,
    "VERIFIER": FrameState.VERIFICATION_COMPLETE,
    "PREDICTOR": FrameState.PREDICTION_COMPLETE,
    "ORCHESTRATOR": FrameState.ORCHESTRATION_COMPLETE,
    "ROUTER_DISPATCH": FrameState.DISPATCH_COMPLETE,
}


class OODAEngine:
    """
    Orchestrates the Observe-Orient-Decide-Act (OODA) multi-agent pipeline.
    Dependency Execution Order:
    RECON -> VERIFIER -> PREDICTOR -> ORCHESTRATOR -> ROUTER_DISPATCH
    """

    def __init__(
        self,
        registry: AgentRegistry = agent_registry,
        state_manager: IntelligenceStateManager = intelligence_state_manager,
        bus: EventBus = event_bus,
        pipeline_order: Optional[List[str]] = None
    ):
        self.registry = registry
        self.state_manager = state_manager
        self.bus = bus
        self.pipeline_order = pipeline_order or DEFAULT_PIPELINE_ORDER

    async def run_pipeline(
        self,
        frame_id: str,
        observation: Dict[str, Any],
        force_reexecute: bool = False
    ) -> Dict[str, Any]:
        """
        Executes the 5-agent pipeline sequentially in strict dependency order for a frame.
        """
        pipeline_start_time = time.time()
        logger.info(f"[OODAEngine] Launching intelligence pipeline for frame {frame_id}")
        self.state_manager.metrics["pipeline_runs"] += 1

        # 1. Update state manager with observation
        self.state_manager.record_frame_observation(frame_id, observation)
        inc = self.state_manager.incident_manager.get_current_incident()

        # Reset agent statuses to WAITING
        for agent_name in self.pipeline_order:
            self.state_manager.set_agent_status(agent_name, "WAITING")

        # Publish FRAME_READY_FOR_INTELLIGENCE event
        await self.bus.publish(IntelligenceEvent(
            event_type=EventTypes.FRAME_READY_FOR_INTELLIGENCE.value,
            frame_id=frame_id,
            incident_id=inc.incident_id,
            source="OODAEngine",
            payload={"coverage": observation.get("flood", {}).get("coverage_percent", 0.0)}
        ))

        # Initial AgentContext
        context = AgentContext(
            frame_id=frame_id,
            incident_id=inc.incident_id,
            timestamp=observation.get("timestamp", ""),
            observation=observation,
            previous_observation=self.state_manager.previous_observation,
            current_state=self.state_manager.get_full_state()
        )

        pipeline_results: Dict[str, AgentResult] = {}
        pipeline_failed = False

        # 2. Sequential Dependency Execution
        for agent_name in self.pipeline_order:
            # Idempotency check
            if not force_reexecute and self.state_manager.is_idempotent_done(inc.incident_id, frame_id, agent_name):
                logger.info(f"[{agent_name}] Idempotency match: reusing cached result for {frame_id}")
                cached_res = self.state_manager.get_frame_agent_results(frame_id).get(agent_name)
                if cached_res:
                    pipeline_results[agent_name] = cached_res
                    context = context.with_agent_result(agent_name, cached_res.to_read_only_dict())
                    self.state_manager.set_agent_status(agent_name, "COMPLETE")
                    continue

            agent = self.registry.get(agent_name)
            if not agent:
                logger.error(f"[OODAEngine] Agent {agent_name} not found in registry!")
                self.state_manager.set_agent_status(agent_name, "FAILED")
                pipeline_failed = True
                continue

            # Update status to RUNNING
            self.state_manager.set_agent_status(agent_name, "RUNNING")
            await self.bus.publish(IntelligenceEvent(
                event_type=EventTypes.AGENT_STARTED.value,
                frame_id=frame_id,
                incident_id=inc.incident_id,
                source=agent_name,
                payload={"status": "RUNNING"}
            ))

            # Realistic short processing delay for demonstration (600ms per agent)
            await asyncio.sleep(0.6)

            # Execute agent (wraps validation, timeout, retries, timing)
            res = await agent.execute(context)
            res = self.validate_agent_consistency(agent_name, res, observation)
            self.state_manager.record_agent_result(res)
            pipeline_results[agent_name] = res

            if res.status == AgentStatus.SUCCESS:
                self.state_manager.set_agent_status(agent_name, "COMPLETE")
                if agent_name in STATE_MAP:
                    frame_tracker.set_state(frame_id, STATE_MAP[agent_name])
                # Downstream read-only context update
                context = context.with_agent_result(agent_name, res.to_read_only_dict())

                await self.bus.publish(IntelligenceEvent(
                    event_type=EventTypes.AGENT_COMPLETED.value,
                    frame_id=frame_id,
                    incident_id=inc.incident_id,
                    source=agent_name,
                    payload={
                        "status": "COMPLETE",
                        "confidence": res.confidence,
                        "latency_ms": res.execution_time_ms,
                        "result": res.result
                    }
                ))

                # Emit specific completion events
                specific_event = getattr(EventTypes, f"{agent_name}_COMPLETED", None) or getattr(EventTypes, f"{agent_name}_CREATED", None)
                if specific_event:
                    await self.bus.publish(IntelligenceEvent(
                        event_type=specific_event.value,
                        frame_id=frame_id,
                        incident_id=inc.incident_id,
                        source=agent_name,
                        payload=res.result
                    ))

            else:
                # Failure isolation: Mark agent as FAILED, publish AGENT_FAILED, but continue pipeline with fallback context
                self.state_manager.set_agent_status(agent_name, "FAILED")
                pipeline_failed = True

                await self.bus.publish(IntelligenceEvent(
                    event_type=EventTypes.AGENT_FAILED.value,
                    frame_id=frame_id,
                    incident_id=inc.incident_id,
                    source=agent_name,
                    payload={"status": "FAILED", "errors": res.errors}
                ))

                # Pass fallback failed dictionary to downstream context
                context = context.with_agent_result(agent_name, res.to_read_only_dict())

        total_latency_ms = round((time.time() - pipeline_start_time) * 1000, 2)
        if pipeline_failed:
            self.state_manager.metrics["pipeline_failures"] += 1

        summary_event = EventTypes.PIPELINE_FAILED.value if pipeline_failed else EventTypes.PIPELINE_COMPLETED.value
        await self.bus.publish(IntelligenceEvent(
            event_type=summary_event,
            frame_id=frame_id,
            incident_id=inc.incident_id,
            source="OODAEngine",
            payload={
                "status": "FAILED" if pipeline_failed else "SUCCESS",
                "total_latency_ms": total_latency_ms,
                "agent_statuses": self.state_manager.get_agent_statuses()
            }
        ))

        return {
            "status": "FAILED" if pipeline_failed else "SUCCESS",
            "frame_id": frame_id,
            "incident_id": inc.incident_id,
            "total_latency_ms": total_latency_ms,
            "agent_statuses": self.state_manager.get_agent_statuses(),
            "results": {name: res.model_dump(mode="json") for name, res in pipeline_results.items()}
        }

    def validate_agent_consistency(self, agent_name: str, res: AgentResult, observation: Dict[str, Any]) -> AgentResult:
        """
        Enforces strict ground-truth consistency: Downstream agent results MUST NOT contradict upstream physical observation.
        If observation indicates no flooding (flood_detected = False or coverage <= 0.5%),
        forces agent outputs to NORMAL / DRY / STANDBY states.
        """
        if not res.result or res.status != AgentStatus.SUCCESS:
            return res

        flood_meta = observation.get("flood", {})
        cov = float(flood_meta.get("coverage_percent", 0.0))
        is_dry = cov <= 0.5

        res_data = res.result

        if is_dry:
            if agent_name == "RECON":
                res_data["flood_detected"] = False
                res_data["flood_coverage_percent"] = 0.0
                res_data["affected_sectors"] = []
                res_data["blocked_roads"] = []
                res_data["bridge_status"] = "OPEN"
                res_data["affected_buildings"] = 0
            elif agent_name == "VERIFIER":
                res_data["severity"] = "NORMAL"
                res_data["newly_affected_sectors"] = []
                res_data["flood_change_percent"] = 0.0
                res_data["anomaly_detected"] = False
            elif agent_name == "PREDICTOR":
                res_data["current_risk"] = "NORMAL"
                res_data["predicted_sectors"] = []
                res_data["predicted_flood_expansion_percent"] = 0.0
            elif agent_name == "ORCHESTRATOR":
                res_data["priority"] = "NORMAL"
                res_data["actions"] = [{"action": "MONITOR", "reason": "No active flooding detected."}]
                res_data["reasoning_summary"] = "No active flooding detected across physical testbed model. Continuing routine surveillance."
            elif agent_name == "ROUTER_DISPATCH":
                res_data["dispatch_status"] = "STANDBY"
                res_data["network_status"] = "CLEAR"
                res_data["blocked_roads"] = []
                res_data["routes"] = []
                res_data["dispatches"] = []

        return res


ooda_engine = OODAEngine()
