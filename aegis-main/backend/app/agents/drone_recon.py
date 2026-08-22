"""
Agent 9: Drone Recon Agent
Simulates visual/thermal drone sweeps over active disaster sectors.
Identifies stranded civilian groupings and reports blockages.
"""
from typing import List, Dict, Tuple, TYPE_CHECKING
import random
import uuid
from datetime import datetime

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine

from ..models.agent import AgentDecision, AgentName


class DroneReconAgent:
    def __init__(self):
        self.name = AgentName.DRONE_RECON
        self.drone_id = "DRONE-RECON-ALPHA"
        self.battery_pct = 100
        self.current_sector = "Sector-1"

    def process(
        self,
        engine: "SimulationEngine",
    ) -> Tuple[List[Dict], List[AgentDecision]]:
        decisions: List[AgentDecision] = []
        scans: List[Dict] = []

        # Deplete battery slowly
        if engine.tick > 0:
            self.battery_pct = max(15, self.battery_pct - 3)

        # Recharge battery if very low
        if self.battery_pct <= 20:
            self.battery_pct = 100

        # Scan active sectors
        active_sectors = []
        disaster_type = getattr(engine, "disaster_type", "flood")

        if disaster_type == "wildfire":
            # Sectors with high heat/fire
            for row in engine.city.grid:
                for cell in row:
                    # In wildfire mode, flood_level represents fire intensity
                    if cell.flood_level > 0.3 and cell.sector_id not in active_sectors:
                        active_sectors.append(cell.sector_id)
        elif disaster_type == "cyclone":
            # Cyclone sectors
            for row in engine.city.grid:
                for cell in row:
                    if (cell.flood_level > 0.2 or cell.is_blocked) and cell.sector_id not in active_sectors:
                        active_sectors.append(cell.sector_id)
        else: # flood
            # Flooded sectors
            active_sectors = engine.city.get_flooded_sectors()

        # Fallback to random sector if none affected
        if not active_sectors:
            active_sectors = [f"Sector-{random.randint(1, 16)}"]

        # Drone selects the most critical sector to scan
        self.current_sector = active_sectors[0]

        # Scan cells in current sector
        sector_cells = engine.city.get_sector_cells(self.current_sector)
        max_water_or_fire = max((c.flood_level for c in sector_cells), default=0.0)
        blocked_count = sum(1 for c in sector_cells if c.is_blocked)
        has_failed_bridge = any(c.bridge_failed for c in sector_cells if c.is_bridge)

        # Estimate stranded civilians (thermal signatures)
        # Higher flood/fire = more stranded near building/shelter zones
        base_stranded = 0
        for cell in sector_cells:
            if cell.flood_level > 0.5:
                # ~5-10% of cell population trapped
                base_stranded += int(cell.population_density * 0.08)

        thermal_count = max(0, base_stranded + random.randint(-5, 10))

        # Infrastructure assessment
        road_status = "Submerged" if max_water_or_fire > 1.2 else ("Obstructed" if blocked_count > 2 else "Clear")
        infra_desc = "Bridge Collapse" if has_failed_bridge else ("Stressed Bridges" if max_water_or_fire > 1.5 else "Stable")

        scan_result = {
            "drone_id": self.drone_id,
            "sector": self.current_sector,
            "altitude_m": random.choice([100.0, 120.0, 150.0]),
            "battery_pct": self.battery_pct,
            "thermal_signatures": thermal_count,
            "road_status": road_status,
            "infrastructure_damage": infra_desc,
            "timestamp": datetime.utcnow().isoformat()
        }
        scans.append(scan_result)

        # Log agent decision
        decisions.append(AgentDecision(
            agent_name=AgentName.DRONE_RECON,
            action=f"Drone Scan Complete: {self.current_sector}",
            description=f"Drone detected {thermal_count} thermal signatures. Roads: {road_status}. Infra: {infra_desc}.",
            reasoning=(
                f"Patrolling high-threat zones. Executed thermal scans in {self.current_sector}. "
                f"Anomalies found: {thermal_count} stranded citizens. Infrastructure health status is {infra_desc}. "
                f"Telemetry transmitted to EOC database."
            ),
            sop_reference="SOP-002",
            severity="critical" if thermal_count > 15 else ("warning" if thermal_count > 0 else "info")
        ))

        return scans, decisions
