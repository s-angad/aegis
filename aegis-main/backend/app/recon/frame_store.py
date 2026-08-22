from typing import List, Optional, Dict
from datetime import datetime
from .models import ReconObservation, ReconConfig


class FrameStore:
    """
    In-memory store holding recent reconnaissance frames and analytical telemetry.
    Supports historical scrubbing, trend calculation, and frame-to-frame diffing.
    """

    def __init__(self, max_history: int = 60):
        self.max_history = max_history
        self.history: List[ReconObservation] = []
        self.frame_counter: int = 0
        self.config: ReconConfig = ReconConfig()
        self.last_frame_bytes: Optional[bytes] = None

    def add_observation(self, obs: ReconObservation) -> None:
        self.frame_counter += 1
        obs.frame_number = self.frame_counter
        self.history.append(obs)
        if len(self.history) > self.max_history:
            self.history.pop(0)

    def get_latest(self) -> Optional[ReconObservation]:
        return self.history[-1] if self.history else None

    def get_previous(self) -> Optional[ReconObservation]:
        return self.history[-2] if len(self.history) >= 2 else None

    def get_history(self, limit: int = 30) -> List[ReconObservation]:
        return self.history[-limit:]

    def get_metrics_timeline(self) -> List[Dict]:
        """Returns time-series data for UI graphs."""
        return [
            {
                "frame": obs.frame_number,
                "timestamp": obs.timestamp.isoformat(),
                "flood_area_percent": obs.flood_area_percent,
                "estimated_water_level": obs.estimated_water_level,
                "estimated_velocity": obs.estimated_velocity,
                "expansion_rate": obs.expansion_rate,
                "confidence": obs.confidence,
            }
            for obs in self.history
        ]

    def clear(self) -> None:
        self.history.clear()
        self.frame_counter = 0
        self.last_frame_bytes = None


# Global singleton instance
frame_store = FrameStore()
