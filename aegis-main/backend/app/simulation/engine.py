"""
Main simulation engine: tick-based async loop driving the AEGIS OS city simulation.
Supports dynamic seedable scenario generation (Flood, Wildfire, and Cyclone).
Tracks Casualty Prevention metrics (Lives at risk vs. Lives saved) and dynamic OODA events.
"""
import asyncio
import uuid
import random
from datetime import datetime
from typing import List, Dict, Any, Optional, Callable, Awaitable

from .city import CityGrid, SHELTER_LOCATIONS
from .flood import advance_disaster
from .citizens import generate_citizen_reports
from .scenario_generator import generate_scenario, ScenarioConfig
from ..models.incident import RawReport
from ..models.shelter import Shelter, ShelterStatus
from ..models.resource import Resource, ResourceType, ResourceStatus


class SimulationEngine:
    def __init__(self):
        self.city = CityGrid()
        self.tick: int = 0
        self.is_running: bool = False
        self.is_paused: bool = False
        self.speed: float = 1.0               # 1x normal speed multiplier
        self.tick_interval: float = 1.0       # 1.0s normal base interval (1 tick / sec)
        self.disaster_type: str = "flood"     # flood, wildfire, cyclone

        # Scenario & Metrics
        self.scenario_config: Optional[ScenarioConfig] = None
        self.projected_lives_at_risk: int = 0
        self.lives_saved: int = 0
        self.risk_reduction_pct: float = 0.0

        self.raw_reports: List[RawReport] = []
        self.shelters: List[Shelter] = []
        self.resources: List[Resource] = []

        self.timeline: List[Dict[str, Any]] = []
        self.run_type: str = "baseline"
        self.is_aegis_enabled: bool = False
        self._broadcast_callback: Optional[Callable[[str, Any], Awaitable[None]]] = None
        self._agent_callback: Optional[Callable[["SimulationEngine"], Awaitable[None]]] = None
        self._task: Optional[asyncio.Task] = None

    def initialize_scenario(self, seed: Optional[int] = None):
        self.scenario_config = generate_scenario(seed)
        self.shelters = self._init_shelters()
        self.resources = self._init_resources()

    def _init_shelters(self) -> List[Shelter]:
        shelters = []
        for s in SHELTER_LOCATIONS:
            cell = self.city.get_cell(s["row"], s["col"])
            if cell:
                name = s["name"]
                if self.disaster_type == "wildfire":
                    name = name.replace("Shelter", "SafeZone")
                shelters.append(Shelter(
                    id=str(uuid.uuid4())[:8],
                    name=name,
                    lat=cell.center_lat,
                    lng=cell.center_lng,
                    sector=s["sector"],
                    capacity=s["capacity"],
                    current_occupancy=0,
                    status=ShelterStatus.STANDBY,
                    address=f"{s['sector']}, Emergency Shelter",
                ))
        return shelters

    def _init_resources(self) -> List[Resource]:
        lat_base, lng_base = 28.6080, 77.2145
        resources = []

        # 1. 10 Rescue Boats
        for i in range(10):
            resources.append(Resource(
                id=f"RB-{i+1:02d}", type=ResourceType.RESCUE_BOAT, name=f"Rescue Boat {i+1:02d}",
                lat=lat_base + (i * 0.0003), lng=lng_base, home_lat=lat_base, home_lng=lng_base, crew_count=3, capacity=6
            ))
        # 2. 3 Helicopters
        for i in range(3):
            resources.append(Resource(
                id=f"HC-{i+1:02d}", type=ResourceType.HELICOPTER, name=f"Rescue Helicopter {i+1:02d}",
                lat=28.6200 + (i * 0.0004), lng=77.2090, home_lat=28.6200, home_lng=77.2090, crew_count=4, capacity=8
            ))
        # 3. 7 Ambulances
        for i in range(7):
            resources.append(Resource(
                id=f"AM-{i+1:02d}", type=ResourceType.AMBULANCE, name=f"Ambulance {i+1:02d}",
                lat=28.6110, lng=77.2060 + (i * 0.0003), home_lat=28.6110, home_lng=77.2060, crew_count=2, capacity=2
            ))
        # 4. 5 Water Pumps
        for i in range(5):
            resources.append(Resource(
                id=f"WP-{i+1:02d}", type=ResourceType.WATER_PUMP, name=f"High-Cap Water Pump {i+1:02d}",
                lat=28.6050 + (i * 0.0005), lng=77.2180, home_lat=28.6050, home_lng=77.2180, crew_count=3, capacity=1
            ))
        # 5. 6 Relief Teams
        for i in range(6):
            resources.append(Resource(
                id=f"RT-{i+1:02d}", type=ResourceType.RELIEF_TEAM, name=f"Disaster Relief Team {i+1:02d}",
                lat=lat_base - 0.0010, lng=lng_base + (i * 0.0003), home_lat=lat_base - 0.0010, home_lng=lng_base, crew_count=5, capacity=200
            ))
        # 6. 6 NGO Organizations (500+ volunteers)
        for i in range(6):
            resources.append(Resource(
                id=f"NGO-{i+1:02d}", type=ResourceType.NGO_VOLUNTEER, name=f"NGO Volunteer Unit {i+1:02d}",
                lat=28.6020, lng=77.2100 + (i * 0.0004), home_lat=28.6020, home_lng=77.2100, crew_count=85, capacity=500
            ))

        return resources

    def set_broadcast_callback(self, cb: Callable[[str, Any], Awaitable[None]]):
        self._broadcast_callback = cb

    def set_agent_callback(self, cb: Callable[["SimulationEngine"], Awaitable[None]]):
        self._agent_callback = cb

    async def _broadcast(self, event_type: str, data: Any):
        if self._broadcast_callback:
            await self._broadcast_callback(event_type, data)

    def start(self, seed: Optional[int] = None):
        if self._task and not self._task.done() and self.is_running and not self.is_paused:
            return
        if self.tick >= 20 or self.tick == 0:
            self.reset(self.disaster_type, seed)
        if not self.scenario_config:
            self.initialize_scenario(seed)
        self.is_running = True
        self.is_paused = False
        if not self._task or self._task.done():
            self._task = asyncio.create_task(self._run_loop())

    def pause(self):
        self.is_paused = True

    def resume(self):
        self.is_paused = False
        if not self.is_running or (self._task and self._task.done()):
            self.is_running = True
            if self.tick < 20:
                self._task = asyncio.create_task(self._run_loop())

    def stop(self):
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()

    def reset(self, disaster_type: str = "flood", seed: Optional[int] = None):
        self.stop()
        self.disaster_type = disaster_type
        self.city = CityGrid()
        self.tick = 0
        self.initialize_scenario(seed)
        self.projected_lives_at_risk = 0
        self.lives_saved = 0
        self.risk_reduction_pct = 0.0
        self.raw_reports = []
        self.timeline = []
        self.is_paused = False

    def set_speed(self, speed: float):
        self.speed = max(0.25, min(speed, 8.0))

    def get_shelter_by_name(self, name: str) -> Optional[Shelter]:
        for s in self.shelters:
            if s.name == name:
                return s
        return None

    def activate_shelter(self, name: str):
        shelter = self.get_shelter_by_name(name)
        if shelter and shelter.status == ShelterStatus.STANDBY:
            shelter.status = ShelterStatus.ACTIVE

    def add_evacuees_to_shelter(self, shelter_name: str, count: int):
        shelter = self.get_shelter_by_name(shelter_name)
        if shelter and shelter.status == ShelterStatus.ACTIVE:
            shelter.current_occupancy = min(shelter.capacity, shelter.current_occupancy + count)
            if shelter.current_occupancy >= int(shelter.capacity * 0.95):
                shelter.status = ShelterStatus.FULL

    def get_available_resources(self) -> List[Resource]:
        return [r for r in self.resources if r.status.value in ("available", "standby")]

    async def _run_loop(self):
        sc = self.scenario_config
        try:
            while self.is_running and self.tick < 20:
                if self.is_paused:
                    await asyncio.sleep(0.3)
                    continue

                self.tick += 1
                rain_rate = sc.rainfall_profile[min(self.tick - 1, len(sc.rainfall_profile) - 1)] if sc else 0.5

                # --- Advance disaster physics ---
                flood_state = advance_disaster(self.city, rain_rate, self.disaster_type, sc, self.tick)

                # Bridge failure trigger at scenario fail tick
                if sc and self.tick == sc.bridge_fail_tick and sc.vulnerable_bridges:
                    bridge_row = sc.vulnerable_bridges[0]
                    self.city.fail_bridge(bridge_row)
                    await self._broadcast("sensor_alert", {
                        "type": "bridge_fail",
                        "bridge_row": bridge_row,
                        "message": f"BRIDGE FAILURE: Bridge Row-{bridge_row} HAS COLLAPSED!"
                    })

                # --- Generate citizen reports ---
                new_reports = generate_citizen_reports(
                    self.city, self.tick, rain_rate
                )
                self.raw_reports.extend(new_reports)

                # --- Compute Casualty Prevention Metrics ---
                self.projected_lives_at_risk = int(flood_state.affected_population * 1.1 + self.tick * 60)
                shelter_pop = sum(s.current_occupancy for s in self.shelters)
                active_rescues = sum(r.crew_count * 15 for r in self.resources if r.status in (ResourceStatus.ON_SCENE, ResourceStatus.RETURNING))
                self.lives_saved = min(self.projected_lives_at_risk, shelter_pop + active_rescues)

                if self.projected_lives_at_risk > 0:
                    self.risk_reduction_pct = round((self.lives_saved / self.projected_lives_at_risk) * 100, 1)

                # --- Broadcast state update ---
                await self._broadcast("flood_update", {
                    "tick": self.tick,
                    "flood_geojson": self.city.to_flood_geojson(),
                    "flood_state": {
                        "total_flooded_cells": flood_state.total_flooded_cells,
                        "total_flooded_sectors": flood_state.total_flooded_sectors,
                        "affected_population": flood_state.affected_population,
                        "blocked_roads": flood_state.blocked_roads,
                        "river_level": flood_state.river_level,
                        "max_flood_level": flood_state.max_flood_level,
                        "bridge_status": flood_state.bridge_status,
                    },
                    "scenario": {
                        "seed": sc.seed if sc else 42,
                        "seed_str": sc.seed_str if sc else "SIM-42",
                        "scenario_type": sc.scenario_type if sc else "Flood",
                        "description": sc.description if sc else "",
                        "river_baseline": sc.river_baseline if sc else 1.2,
                        "rainfall_peak": sc.rainfall_peak if sc else 50.0,
                        "primary_threat_sectors": sc.primary_threat_sectors if sc else ["Sector-4"],
                    }
                })

                # --- Invoke Multi-Agent OODA Loop Callback Every 3 Ticks (PAUSING FLOOD PHYSICS DURING AGENT EXECUTION) ---
                if self.is_aegis_enabled and self._agent_callback and (self.tick > 0 and self.tick % 3 == 0):
                    print(f"[SIMULATION] TICK {self.tick} — [PAUSE] PAUSING FLOOD SIMULATION FOR AEGIS")
                    await self._broadcast("simulation_control", {"action": "paused_for_aegis", "tick": self.tick})
                    try:
                        await self._agent_callback(self)
                    except Exception as e:
                        print(f"[SIM ENGINE WARNING] Agent callback exception at tick {self.tick}: {e}")
                    print(f"[SIMULATION] TICK {self.tick} — [RESUME] AEGIS CYCLE COMPLETE — RESUMING FLOOD SIMULATION")
                    await self._broadcast("simulation_control", {"action": "resumed_after_aegis", "tick": self.tick})

                # --- Sleep based on speed setting ---
                interval = max(0.05, self.tick_interval / max(0.1, self.speed))
                await asyncio.sleep(interval)

        except Exception as e:
            import traceback
            print(f"[SIM ENGINE ERROR] Unhandled loop exception at tick {self.tick}: {e}")
            traceback.print_exc()
        finally:
            self.is_running = False
            await self._broadcast("simulation_control", {"action": "completed", "tick": self.tick})

    def get_state_summary(self) -> Dict[str, Any]:
        sc = self.scenario_config
        return {
            "tick": self.tick,
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "speed": self.speed,
            "disaster_type": self.disaster_type,
            "projected_lives_at_risk": self.projected_lives_at_risk,
            "lives_saved": self.lives_saved,
            "risk_reduction_pct": self.risk_reduction_pct,
            "scenario": {
                "seed": sc.seed if sc else 42,
                "seed_str": sc.seed_str if sc else "SIM-42",
                "scenario_type": sc.scenario_type if sc else "Flood",
                "description": sc.description if sc else "",
                "river_baseline": sc.river_baseline if sc else 1.2,
                "rainfall_peak": sc.rainfall_peak if sc else 50.0,
                "primary_threat_sectors": sc.primary_threat_sectors if sc else ["Sector-4"],
            }
        }


def validate_fresh_simulation_state(engine: SimulationEngine):
    """
    Asserts that the newly initialized simulation engine is completely clean:
    tick == 0, flooded_cells == 0, water_in_city == 0, blocked_roads == 0, bridge_failures == 0.
    Raises RuntimeError if any flooded state is inherited from a previous run.
    """
    all_cells = [cell for row in engine.city.grid for cell in row]
    flooded_cells = len([c for c in all_cells if c.flood_level > 0])
    total_water = sum(c.flood_level for c in all_cells)
    blocked_roads = len([c for c in all_cells if c.is_blocked])
    bridge_failures = len([c for c in all_cells if c.bridge_failed])
    sc = engine.scenario_config
    seed_val = sc.seed if sc else "002"

    print("=============================")
    print("AEGIS RUN 02 INITIAL STATE")
    print("=============================")
    print(f"run_id: aegis-{seed_val}")
    print(f"tick: {engine.tick}")
    print(f"phase: 1")
    print(f"river_level: NORMAL")
    print(f"water_inside_city: {total_water:.2f}m")
    print(f"flooded_cells: {flooded_cells}")
    print(f"flooded_area: 0%")
    print(f"people_at_risk: {engine.projected_lives_at_risk}")
    print(f"blocked_roads: {blocked_roads}")
    print(f"bridge_failures: {bridge_failures}")
    print(f"active_incidents: {len(engine.raw_reports)}")
    print(f"deployed_resources: 0")
    print("=============================")

    if engine.tick != 0 or flooded_cells != 0 or total_water > 0.001 or blocked_roads != 0 or bridge_failures != 0:
        raise RuntimeError(
            f"[AEGIS INIT ERROR] Non-zero initial state detected! tick={engine.tick}, flooded_cells={flooded_cells}, water={total_water}"
        )


def create_fresh_simulation(disaster_type: str = "flood", seed: Optional[int] = None) -> SimulationEngine:
    """
    AUTHORITATIVE FACTORY: Instantiates a completely new SimulationEngine,
    a new CityGrid, new ScenarioConfig, new Shelters, and new Resources.
    Executes hard validation assertions before returning the instance.
    """
    engine = SimulationEngine()
    engine.reset(disaster_type=disaster_type, seed=seed)
    validate_fresh_simulation_state(engine)
    return engine

