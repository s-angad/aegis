"""
AEGIS FLOOD v2.0 - Intelligence State Manager (Phase 4A)
Maintains current/previous frame observations, agent execution results, idempotency checks, and live agent statuses.
"""
from typing import Dict, List, Any, Optional
import logging

from ..schemas.incident import Incident, active_incident_manager
from ..schemas.results import AgentResult

logger = logging.getLogger("aegis-intelligence-state")


class IntelligenceStateManager:
    """
    In-memory state manager for the intelligence pipeline.
    Tracks active incident, current/previous frame observations, agent results,
    idempotency keys, and live agent execution statuses for dashboard rendering.
    """

    def __init__(self, incident_manager=active_incident_manager):
        self.incident_manager = incident_manager
        self.current_frame_id: Optional[str] = None
        self.previous_frame_id: Optional[str] = None
        self.current_observation: Optional[Dict[str, Any]] = None
        self.previous_observation: Optional[Dict[str, Any]] = None

        # Frame -> AgentName -> AgentResult
        self.agent_results_history: Dict[str, Dict[str, AgentResult]] = {}

        # Completed idempotency keys set
        self.completed_idempotency_keys: set = set()

        # Live agent pipeline statuses for dashboard visualization
        self.agent_statuses: Dict[str, str] = {
            "RECON": "WAITING",
            "VERIFIER": "WAITING",
            "PREDICTOR": "WAITING",
            "ORCHESTRATOR": "WAITING",
            "ROUTER_DISPATCH": "WAITING"
        }

        # Metrics counters
        self.metrics = {
            "pipeline_runs": 0,
            "pipeline_failures": 0,
            "agent_executions": 0,
            "agent_failures": 0,
            "agent_timeouts": 0
        }

    def set_agent_status(self, agent_name: str, status: str):
        """Update live status of an agent (e.g. WAITING, RUNNING, COMPLETE, FAILED)."""
        self.agent_statuses[agent_name] = status

    def get_agent_statuses(self) -> Dict[str, str]:
        return dict(self.agent_statuses)

    def is_idempotent_done(self, incident_id: str, frame_id: str, agent_name: str) -> bool:
        """Checks if an agent has already executed for this incident + frame."""
        key = f"{incident_id}:{frame_id}:{agent_name}"
        return key in self.completed_idempotency_keys

    def mark_idempotent_done(self, incident_id: str, frame_id: str, agent_name: str):
        key = f"{incident_id}:{frame_id}:{agent_name}"
        self.completed_idempotency_keys.add(key)

    def record_frame_observation(self, frame_id: str, observation: Dict[str, Any]):
        """Records new frame observation, updating current and previous pointers."""
        if self.current_frame_id and self.current_frame_id != frame_id:
            self.previous_frame_id = self.current_frame_id
            self.previous_observation = self.current_observation

        self.current_frame_id = frame_id
        self.current_observation = observation

        # Update active incident
        inc = self.incident_manager.get_current_incident()
        inc.record_frame(frame_id)

    def record_agent_result(self, result: AgentResult):
        """Stores agent execution result in history."""
        frame_id = result.frame_id
        if frame_id not in self.agent_results_history:
            self.agent_results_history[frame_id] = {}
        self.agent_results_history[frame_id][result.agent] = result
        self.mark_idempotent_done(result.incident_id, frame_id, result.agent)

        self.metrics["agent_executions"] += 1
        if result.status.value == "FAILED":
            self.metrics["agent_failures"] += 1
            if any("TIMEOUT" in err for err in result.errors):
                self.metrics["agent_timeouts"] += 1

    def get_frame_agent_results(self, frame_id: str) -> Dict[str, AgentResult]:
        return self.agent_results_history.get(frame_id, {})

    def get_full_state(self) -> Dict[str, Any]:
        inc = self.incident_manager.get_current_incident()

        return {
            "incident": inc.model_dump(mode="json"),
            "current_frame_id": self.current_frame_id,
            "previous_frame_id": self.previous_frame_id,
            "agent_statuses": self.agent_statuses,
            "latest_agent_results": {
                agent: res.model_dump(mode="json")
                for agent, res in self.agent_results_history.get(self.current_frame_id or "", {}).items()
            },
            "metrics": self.metrics
        }


intelligence_state_manager = IntelligenceStateManager()
