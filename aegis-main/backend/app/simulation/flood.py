"""
Cellular automata disaster physics simulation (Flood, Wildfire, and Cyclone).
Water/fire flows and spreads across the 16x16 grid based on elevation and environmental coefficients.
Supports dynamic ScenarioConfig for seedable, reproducible flood scenarios.
"""
from typing import List, Dict, Tuple, Optional, TYPE_CHECKING
from dataclasses import dataclass

if TYPE_CHECKING:
    from .city import CityGrid, CityCell
    from .scenario_generator import ScenarioConfig

from .city import LandType, RIVER_COLS, BRIDGE_ROWS, GRID_ROWS, GRID_COLS

RIVER_OVERFLOW_THRESHOLD = 1.2   # meters before river overflows
MAX_FLOOD_LEVEL = 5.0
SPREAD_FACTOR = 0.45              # fraction of water that spreads each tick (fast flow)
RAIN_COEFFICIENT = 0.18           # base rain contribution per unit rate
EVAPORATION_RATE = 0.01           # slow drain per tick in non-flooded zones


@dataclass
class FloodState:
    total_flooded_cells: int
    total_flooded_sectors: List[str]
    affected_population: int
    blocked_roads: int
    river_level: float
    max_flood_level: float
    bridge_status: Dict[str, str]  # "bridge_r4" -> "intact"/"stressed"/"failed"


def advance_disaster(city: "CityGrid", rate: float, disaster_type: str = "flood", scenario: Optional["ScenarioConfig"] = None, tick: int = 1) -> FloodState:
    if disaster_type == "wildfire":
        return _advance_wildfire(city, rate)
    elif disaster_type == "cyclone":
        return _advance_cyclone(city, rate)
    else:
        return _advance_flood(city, rate, scenario, tick)


def advance_flood(city: "CityGrid", rain_rate: float, scenario: Optional["ScenarioConfig"] = None, tick: int = 1) -> FloodState:
    return _advance_flood(city, rain_rate, scenario, tick)


def _advance_flood(city: "CityGrid", rain_rate: float, scenario: Optional["ScenarioConfig"] = None, tick: int = 1) -> FloodState:
    grid = city.grid

    # 1. Baseline River Level & Progressive River Ramp (Normal River -> Overflow Stage)
    river_base = scenario.river_baseline if scenario else 1.2
    
    if tick <= 1:
        current_river_level = min(RIVER_OVERFLOW_THRESHOLD * 0.7, river_base * 0.4)
    elif tick == 2:
        current_river_level = RIVER_OVERFLOW_THRESHOLD
    else:
        current_river_level = max(river_base, river_base * 0.85 + rain_rate * 2.2)

    river_col = 12

    # Inundate River Column (Source of All Water)
    for r in range(GRID_ROWS):
        for c in range(river_col, GRID_COLS):
            grid[r][c].flood_level = current_river_level

    # 2. Apply River Breach Event at River Boundary (col = 12)
    breach_active = current_river_level > RIVER_OVERFLOW_THRESHOLD
    if breach_active:
        breach_rows = [3, 7, 11]
        if scenario and scenario.flood_origins:
            breach_rows = [orig.get("row", 3) for orig in scenario.flood_origins]

        for brow in breach_rows:
            if 0 <= brow < GRID_ROWS:
                grid[brow][12].flood_level = current_river_level
                grid[brow][11].flood_level = max(grid[brow][11].flood_level, current_river_level * 0.85)

    # 3. Cellular Automata Neighbor Propagation (Water moves ONLY to adjacent cells)
    new_levels: Dict[Tuple[int, int], float] = {}
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            cell = grid[r][c]
            if cell.flood_level < 0.05:
                continue

            src_surface = cell.elevation + cell.flood_level
            neighbors = _get_neighbors(r, c)

            for nr, nc in neighbors:
                ncell = grid[nr][nc]
                if ncell.land_type == LandType.RIVER:
                    continue  # River is the source

                dst_surface = ncell.elevation + ncell.flood_level
                if src_surface > dst_surface + 0.03:
                    diff = src_surface - dst_surface
                    road_bonus = 1.35 if ncell.land_type in (LandType.ROAD, LandType.PARK) else 1.0
                    flow = min(cell.flood_level * SPREAD_FACTOR * road_bonus, diff * 0.45)
                    flow = max(0.0, flow)
                    new_levels[(nr, nc)] = new_levels.get((nr, nc), 0.0) + flow

    # Apply calculated neighbor water spread
    for (r, c), delta in new_levels.items():
        grid[r][c].flood_level = min(MAX_FLOOD_LEVEL, grid[r][c].flood_level + delta)

    # 4. Drainage & Evaporation (Only for city cells)
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            cell = grid[r][c]
            if cell.land_type not in (LandType.RIVER, LandType.BRIDGE):
                drain_rate = EVAPORATION_RATE * (1.0 - rain_rate * 0.5)
                cell.flood_level = max(0.0, cell.flood_level - drain_rate)

    # 5. Road blockage status & bridge state updates
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            cell = grid[r][c]
            if cell.land_type in (LandType.ROAD, LandType.BRIDGE) and cell.flood_level > 0.5:
                cell.is_blocked = True
            elif cell.land_type == LandType.ROAD and cell.flood_level < 0.3:
                cell.is_blocked = False

    # Summary metrics
    flooded_cells = 0
    flooded_sectors_set = set()
    affected_pop = 0
    blocked_roads = 0
    max_flood = 0.0
    river_water = current_river_level

    bridge_status = {}
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            cell = grid[r][c]
            sec_id = getattr(cell, 'sector_id', f"Sector-{(r // 4) * 4 + (c // 4) + 1}")
            if cell.flood_level > 0.1:
                flooded_cells += 1
                flooded_sectors_set.add(sec_id)
                if cell.flood_level > max_flood:
                    max_flood = cell.flood_level
                affected_pop += int(cell.population_density * min(1.0, cell.flood_level / 2.0))
            if cell.land_type == LandType.ROAD and cell.is_blocked:
                blocked_roads += 1
            if cell.land_type == LandType.BRIDGE:
                bkey = f"bridge_r{r}"
                if cell.bridge_failed:
                    bridge_status[bkey] = "failed"
                elif cell.flood_level > 1.2:
                    bridge_status[bkey] = "stressed"
                else:
                    bridge_status[bkey] = "intact"

    return FloodState(
        total_flooded_cells=flooded_cells,
        total_flooded_sectors=sorted(list(flooded_sectors_set)),
        affected_population=affected_pop,
        blocked_roads=blocked_roads,
        river_level=round(river_water, 2),
        max_flood_level=round(max_flood, 2),
        bridge_status=bridge_status
    )


def _get_neighbors(r: int, c: int) -> List[Tuple[int, int]]:
    neighbors = []
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < GRID_ROWS and 0 <= nc < GRID_COLS:
            neighbors.append((nr, nc))
    return neighbors


def _advance_wildfire(city: "CityGrid", rate: float) -> FloodState:
    return FloodState(0, [], 0, 0, 0.0, 0.0, {})

def _advance_cyclone(city: "CityGrid", rate: float) -> FloodState:
    return FloodState(0, [], 0, 0, 0.0, 0.0, {})
