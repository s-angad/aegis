"""
AEGIS FLOOD v2.0 - Event Bus & Intelligence Events (Phase 4A)
Lightweight async event abstraction for multi-agent execution pipeline telemetry.
"""
from enum import Enum
from typing import Dict, Any, List, Callable, Awaitable, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid
import logging

logger = logging.getLogger("aegis-event-bus")


class EventTypes(str, Enum):
    FRAME_READY_FOR_INTELLIGENCE = "FRAME_READY_FOR_INTELLIGENCE"
    AGENT_STARTED = "AGENT_STARTED"
    AGENT_COMPLETED = "AGENT_COMPLETED"
    AGENT_FAILED = "AGENT_FAILED"
    RECON_COMPLETED = "RECON_COMPLETED"
    VERIFICATION_COMPLETED = "VERIFICATION_COMPLETED"
    PREDICTION_COMPLETED = "PREDICTION_COMPLETED"
    ACTION_PLAN_CREATED = "ACTION_PLAN_CREATED"
    DISPATCH_PLAN_CREATED = "DISPATCH_PLAN_CREATED"
    PIPELINE_COMPLETED = "PIPELINE_COMPLETED"
    PIPELINE_FAILED = "PIPELINE_FAILED"


class IntelligenceEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"EVT-{uuid.uuid4().hex[:8]}")
    event_type: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
    incident_id: str = "INC-001"
    frame_id: str
    source: str = "OODAEngine"
    payload: Dict[str, Any] = Field(default_factory=dict)


class EventBus:
    """Async event bus for agent execution lifecycle notifications."""

    def __init__(self):
        self._listeners: Dict[str, List[Callable[[IntelligenceEvent], Awaitable[None]]]] = {}

    def subscribe(self, event_type: str, callback: Callable[[IntelligenceEvent], Awaitable[None]]):
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(callback)

    async def publish(self, event: IntelligenceEvent):
        logger.info(f"[EVENT:{event.event_type}] Frame:{event.frame_id} Source:{event.source}")
        listeners = self._listeners.get(event.event_type, [])
        all_listeners = self._listeners.get("*", [])

        for listener in listeners + all_listeners:
            try:
                await listener(event)
            except Exception as e:
                logger.error(f"Error in event listener for {event.event_type}: {e}")


event_bus = EventBus()
