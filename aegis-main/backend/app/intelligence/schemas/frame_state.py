"""
AEGIS FLOOD v2.0 - Frame State Machine (Phase 4B)
Tracks closed-loop frame state transitions:
CAPTURED -> RECEIVED -> QUEUED -> PROCESSING -> RECON_COMPLETE -> VERIFICATION_COMPLETE ->
PREDICTION_COMPLETE -> ORCHESTRATION_COMPLETE -> DISPATCH_COMPLETE -> COMPLETED -> ACKED
"""
from enum import Enum
from typing import Dict, Any, Optional
import time
import logging

logger = logging.getLogger("aegis-frame-state")


class FrameState(str, Enum):
    CAPTURED = "CAPTURED"
    RECEIVED = "RECEIVED"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    RECON_COMPLETE = "RECON_COMPLETE"
    VERIFICATION_COMPLETE = "VERIFICATION_COMPLETE"
    PREDICTION_COMPLETE = "PREDICTION_COMPLETE"
    ORCHESTRATION_COMPLETE = "ORCHESTRATION_COMPLETE"
    DISPATCH_COMPLETE = "DISPATCH_COMPLETE"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ACKED = "ACKED"


class FrameTracker:
    """Tracks current state, history, timestamps, and processing latency of frames."""

    def __init__(self):
        self.frame_states: Dict[str, FrameState] = {}
        self.frame_timestamps: Dict[str, float] = {}
        self.active_frame_id: Optional[str] = None

    def set_state(self, frame_id: str, state: FrameState):
        prev_state = self.frame_states.get(frame_id)
        self.frame_states[frame_id] = state
        self.active_frame_id = frame_id
        if frame_id not in self.frame_timestamps:
            self.frame_timestamps[frame_id] = time.time()
        logger.info(f"[FrameTracker] {frame_id}: {prev_state or 'NEW'} ➔ {state.value}")

    def get_state(self, frame_id: str) -> FrameState:
        return self.frame_states.get(frame_id, FrameState.CAPTURED)

    def get_active_frame_id(self) -> Optional[str]:
        return self.active_frame_id


frame_tracker = FrameTracker()
