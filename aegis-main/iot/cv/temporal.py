"""
AEGIS FLOOD v2.0 - Temporal Change Detection & State Manager
"""
from typing import List, Dict, Optional, Any
from collections import deque
import logging

from .schema import Phase3Observation, ChangeObservation

logger = logging.getLogger("aegis-cv-temporal")


class TemporalStateManager:
    """
    Tracks observation history across frames and calculates temporal deltas
    (Frame N-1 vs Frame N) to detect newly flooded sectors, coverage changes,
    and infrastructure status transitions.
    """

    def __init__(self, max_history: int = 30):
        self.max_history = max_history
        self.history: deque = deque(maxlen=max_history)

    def add_observation(self, obs: Phase3Observation):
        """Append observation to rolling history buffer."""
        self.history.append(obs)

    def get_latest(self) -> Optional[Phase3Observation]:
        if not self.history:
            return None
        return self.history[-1]

    def get_history(self, limit: int = 30) -> List[Phase3Observation]:
        items = list(self.history)
        return items[-limit:]

    def compute_change(self, current_obs: Phase3Observation) -> ChangeObservation:
        """
        Compares current observation against the immediately preceding observation (Frame N-1).
        """
        previous_obs = self.get_latest()

        if not previous_obs:
            # First frame baseline
            return ChangeObservation(
                coverage_delta=0.0,
                newly_affected_sectors=[],
                recovered_sectors=[],
                sector_changes={},
                newly_blocked_roads=[],
                bridge_status_changed=False
            )

        # 1. Total coverage delta
        curr_coverage = current_obs.flood.coverage_percent
        prev_coverage = previous_obs.flood.coverage_percent
        coverage_delta = round(curr_coverage - prev_coverage, 1)

        # 2. Sector level comparisons
        prev_sectors = {s.sector_id: s for s in previous_obs.sectors}
        curr_sectors = {s.sector_id: s for s in current_obs.sectors}

        newly_affected = []
        recovered = []
        sector_changes = {}

        for s_id, c_sec in curr_sectors.items():
            p_sec = prev_sectors.get(s_id)
            if not p_sec:
                continue

            delta = c_sec.flood_percentage - p_sec.flood_percentage
            if abs(delta) >= 0.5:
                sign = "+" if delta > 0 else ""
                sector_changes[s_id] = f"{sign}{delta:.1f}%"

            # Check status transitions
            if p_sec.status == "DRY" and c_sec.status in ["EARLY_FLOOD", "FLOODED", "SEVERELY_FLOODED"]:
                newly_affected.append(s_id)
            elif p_sec.status != "DRY" and c_sec.status == "DRY":
                recovered.append(s_id)

        # 3. Road blockage changes
        prev_blocked = set(r.road_id for r in previous_obs.infrastructure.roads if r.status == "BLOCKED")
        curr_blocked = set(r.road_id for r in current_obs.infrastructure.roads if r.status == "BLOCKED")
        newly_blocked = list(curr_blocked - prev_blocked)

        # 4. Bridge status change
        prev_bridge = previous_obs.infrastructure.bridges[0].status if previous_obs.infrastructure.bridges else "OPEN"
        curr_bridge = current_obs.infrastructure.bridges[0].status if current_obs.infrastructure.bridges else "OPEN"
        bridge_changed = (prev_bridge != curr_bridge)

        return ChangeObservation(
            coverage_delta=coverage_delta,
            newly_affected_sectors=newly_affected,
            recovered_sectors=recovered,
            sector_changes=sector_changes,
            newly_blocked_roads=newly_blocked,
            bridge_status_changed=bridge_changed
        )

    def clear(self):
        self.history.clear()


temporal_state_manager = TemporalStateManager()
