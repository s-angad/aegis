"""
AEGIS FLOOD v2.0 - Agent Execution Result Schemas (Phase 4A)
"""
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class AgentStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class AgentResult(BaseModel):
    """
    Standardized, immutable output wrapper produced by every agent execution.
    """
    agent: str
    agent_version: str = "1.0.0"
    frame_id: str
    incident_id: str = "INC-001"
    status: AgentStatus = AgentStatus.SUCCESS
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    execution_time_ms: float = 0.0
    result: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_read_only_dict(self) -> Dict[str, Any]:
        """Returns a deep copy dictionary for consumption by downstream agents."""
        return self.model_dump(mode="json")
