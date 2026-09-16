"""
AEGIS FLOOD v2.0 - Agent Execution Context Schema (Phase 4A)
Defines the strict, scoped context passed into agents.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class AgentContext(BaseModel):
    """
    Controlled context provided to an agent during pipeline execution.
    Prevents arbitrary global state mutation.
    """
    model_config = ConfigDict(frozen=True)  # Read-only immutability guarantee

    frame_id: str
    incident_id: str = "INC-001"
    timestamp: str = ""
    observation: Dict[str, Any] = Field(default_factory=dict)
    previous_observation: Optional[Dict[str, Any]] = None
    current_state: Dict[str, Any] = Field(default_factory=dict)
    resources: List[Dict[str, Any]] = Field(default_factory=list)
    shelters: List[Dict[str, Any]] = Field(default_factory=list)
    road_graph: Optional[Dict[str, Any]] = None
    agent_results: Dict[str, Any] = Field(default_factory=dict)
    configuration: Dict[str, Any] = Field(default_factory=dict)

    def with_agent_result(self, agent_name: str, result_dict: Dict[str, Any]) -> "AgentContext":
        """
        Creates a new AgentContext instance incorporating a new prior agent result
        without mutating the existing instance.
        """
        updated_results = dict(self.agent_results)
        updated_results[agent_name] = result_dict
        return AgentContext(
            frame_id=self.frame_id,
            incident_id=self.incident_id,
            timestamp=self.timestamp,
            observation=self.observation,
            previous_observation=self.previous_observation,
            current_state=self.current_state,
            resources=self.resources,
            shelters=self.shelters,
            road_graph=self.road_graph,
            agent_results=updated_results,
            configuration=self.configuration
        )
