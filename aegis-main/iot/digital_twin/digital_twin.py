"""
AEGIS FLOOD v2.0 - Digital Twin Synchronized State Engine
Maintains digital twin representation of the physical testbed (river, sectors, buildings, roads, bridges, shelters).
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("aegis-digital-twin")


class DigitalTwinManager:
    """
    Synchronized Digital Twin for AEGIS Physical Testbed.
    Stores and updates digital twin representation based on real smartphone image evidence:
    - River flow state
    - Sector flood percentages (S1-S16)
    - Building statuses (B01-B16, Hospital, Shelters)
    - Road statuses (R01-R20)
    - Bridge crossing status
    - Deterministic flood propagation forecast
    """

    def __init__(self):
        self.mode = "PHYSICAL_TESTBED_LIVE"
        self.last_updated_frame: Optional[str] = None
        self.last_updated_time: Optional[str] = None
        
        # Physical Topology Adjacency Flow Graph
        # River flows S2 -> S6 -> S7 -> S11 -> S15
        self.flow_topology = {
            "S2": ["S6", "S3", "S1"],
            "S6": ["S7", "S5", "S10"],
            "S7": ["S11", "S8", "S6"],
            "S11": ["S15", "S10", "S12"],
            "S15": ["S14", "S16", "S11"]
        }

        self.sectors_state: Dict[str, Dict[str, Any]] = {
            f"S{i}": {"flood_percent": 0.0, "status": "DRY", "risk": "NOMINAL"}
            for i in range(1, 17)
        }
        
        self.buildings_state: Dict[str, Dict[str, Any]] = {
            f"B{i:02d}": {"status": "DRY", "overlap_percent": 0.0} for i in range(1, 17)
        }
        self.buildings_state["HOSPITAL-01"] = {"status": "DRY", "overlap_percent": 0.0}
        self.buildings_state["SHELTER-01"] = {"status": "DRY", "overlap_percent": 0.0}
        self.buildings_state["SHELTER-02"] = {"status": "DRY", "overlap_percent": 0.0}

        self.roads_state: Dict[str, str] = {f"R{i:02d}": "OPEN" for i in range(1, 21)}
        self.bridge_state: str = "OPEN"
        self.total_coverage_percent: float = 0.0

    def update_from_physical_observation(self, obs: Dict[str, Any], frame_id: str, timestamp: str):
        """
        Updates Digital Twin state from canonical Phase 3 CV Physical Observation.
        """
        self.last_updated_frame = frame_id
        self.last_updated_time = timestamp or datetime.now().strftime("%H:%M:%S")

        # Flood Coverage
        flood_data = obs.get("flood", {})
        self.total_coverage_percent = flood_data.get("coverage_percent", 0.0)

        # Update Sectors
        for s in obs.get("sectors", []):
            s_id = s.get("sector_id")
            pct = s.get("flood_percentage", 0.0)
            status = s.get("status", "DRY")
            if s_id in self.sectors_state:
                self.sectors_state[s_id]["flood_percent"] = pct
                self.sectors_state[s_id]["status"] = status
                self.sectors_state[s_id]["risk"] = "CRITICAL" if pct > 40 else ("HIGH" if pct > 15 else "NOMINAL")

        # Update Infrastructure
        infra = obs.get("infrastructure", {})
        
        # Roads
        for r in infra.get("roads", []):
            r_id = r.get("road_id")
            st = r.get("status", "OPEN")
            if r_id in self.roads_state:
                self.roads_state[r_id] = st

        # Bridge
        bridges = infra.get("bridges", [])
        if bridges:
            self.bridge_state = bridges[0].get("status", "OPEN")

        # Buildings
        for b in infra.get("buildings", []):
            b_id = b.get("building_id")
            st = b.get("status", "DRY")
            ov = b.get("flood_overlap_percent", 0.0)
            if b_id in self.buildings_state:
                self.buildings_state[b_id]["status"] = st
                self.buildings_state[b_id]["overlap_percent"] = ov

    def predict_propagation(self) -> Dict[str, Any]:
        """
        Predicts downstream flood expansion using deterministic topology rules.
        """
        active_sectors = [
            s_id for s_id, data in self.sectors_state.items()
            if data["flood_percent"] > 5.0
        ]
        
        predicted_sectors = []
        for s_id in active_sectors:
            downstream = self.flow_topology.get(s_id, [])
            for target in downstream:
                if target not in active_sectors and target not in predicted_sectors:
                    predicted_sectors.append(target)

        return {
            "currently_flooded_sectors": active_sectors,
            "projected_next_sectors": predicted_sectors[:3],
            "rate_of_spread": f"+{round(self.total_coverage_percent * 0.15 + 1.2, 1)}%/min",
            "time_to_next_threshold_mins": 3.5 if predicted_sectors else 10.0
        }

    def get_state_dict(self) -> Dict[str, Any]:
        """Export complete Digital Twin state dictionary."""
        affected_b = [b_id for b_id, d in self.buildings_state.items() if d["status"] != "DRY"]
        blocked_r = [r_id for r_id, st in self.roads_state.items() if st == "BLOCKED"]
        
        return {
            "mode": self.mode,
            "last_updated_frame": self.last_updated_frame,
            "last_updated_time": self.last_updated_time,
            "total_coverage_percent": self.total_coverage_percent,
            "sectors": self.sectors_state,
            "bridge": {"id": "BRIDGE-01", "status": self.bridge_state},
            "affected_buildings": affected_b,
            "blocked_roads": blocked_r,
            "propagation_forecast": self.predict_propagation()
        }


digital_twin_manager = DigitalTwinManager()
