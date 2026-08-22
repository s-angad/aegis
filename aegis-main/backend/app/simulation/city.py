"""
City Digital Twin for AEGIS AI.
16x16 grid centered at lat=28.6139, lng=77.2090 (New Delhi-like coordinates).
Each cell is ~500m x 500m.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from enum import Enum
import math

# Degrees per 500m at ~28° latitude
LAT_PER_CELL = 500 / 111000       # ~0.0045 degrees
LNG_PER_CELL = 500 / (111000 * math.cos(math.radians(28.6)))  # ~0.0051 degrees

CITY_CENTER_LAT = 28.6139
CITY_CENTER_LNG = 77.2090
GRID_ROWS = 16
GRID_COLS = 16


class LandType(str, Enum):
    ROAD = "road"
    BUILDING = "building"
    RIVER = "river"
    PARK = "park"
    SHELTER = "shelter"
    HOSPITAL = "hospital"
    BRIDGE = "bridge"
    FIRE_STATION = "fire_station"
    POLICE = "police"


@dataclass
class CityCell:
    row: int
    col: int
    sector_id: str
    land_type: LandType
    elevation: float          # meters above sea level (relative)
    population_density: int   # people per cell
    flood_level: float = 0.0  # meters of water
    is_blocked: bool = False
    is_bridge: bool = False
    bridge_failed: bool = False

    @property
    def lat(self) -> float:
        # Origin top-left corner
        origin_lat = CITY_CENTER_LAT + (GRID_ROWS / 2) * LAT_PER_CELL
        return origin_lat - self.row * LAT_PER_CELL

    @property
    def lng(self) -> float:
        origin_lng = CITY_CENTER_LNG - (GRID_COLS / 2) * LNG_PER_CELL
        return origin_lng + self.col * LNG_PER_CELL

    @property
    def center_lat(self) -> float:
        return self.lat - LAT_PER_CELL / 2

    @property
    def center_lng(self) -> float:
        return self.lng + LNG_PER_CELL / 2

    def to_dict(self) -> dict:
        return {
            "row": self.row,
            "col": self.col,
            "sector_id": self.sector_id,
            "land_type": self.land_type.value,
            "elevation": self.elevation,
            "population_density": self.population_density,
            "flood_level": round(self.flood_level, 2),
            "is_blocked": self.is_blocked,
            "is_bridge": self.is_bridge,
            "bridge_failed": self.bridge_failed,
            "lat": round(self.center_lat, 6),
            "lng": round(self.center_lng, 6),
        }


# Named sector regions (each covers a 4x4 block of cells)
SECTOR_MAP: Dict[str, Tuple[int, int, int, int]] = {
    # name -> (row_start, row_end, col_start, col_end)
    "Sector-1":  (0, 3, 0, 3),
    "Sector-2":  (0, 3, 4, 7),
    "Sector-3":  (0, 3, 8, 11),
    "Sector-4":  (0, 3, 12, 15),
    "Sector-5":  (4, 7, 0, 3),
    "Sector-6":  (4, 7, 4, 7),
    "Sector-7":  (4, 7, 8, 11),
    "Sector-8":  (4, 7, 12, 15),
    "Sector-9":  (8, 11, 0, 3),
    "Sector-10": (8, 11, 4, 7),
    "Sector-11": (8, 11, 8, 11),
    "Sector-12": (8, 11, 12, 15),
    "Sector-13": (12, 15, 0, 3),
    "Sector-14": (12, 15, 4, 7),
    "Sector-15": (12, 15, 8, 11),
    "Sector-16": (12, 15, 12, 15),
}

# Special locations
SHELTER_LOCATIONS = [
    {"name": "Shelter 01", "row": 1, "col": 1, "capacity": 1000, "sector": "Sector-1"},
    {"name": "Shelter 02", "row": 1, "col": 14, "capacity": 1000, "sector": "Sector-4"},
    {"name": "Shelter 03", "row": 6, "col": 5, "capacity": 1000, "sector": "Sector-6"},
    {"name": "Shelter 04", "row": 14, "col": 1, "capacity": 1000, "sector": "Sector-13"},
    {"name": "Shelter 05", "row": 14, "col": 14, "capacity": 1000, "sector": "Sector-16"},
]

HOSPITAL_LOCATION = {"row": 6, "col": 2, "sector": "Sector-5"}
FIRE_STATION_LOCATION = {"row": 9, "col": 13, "sector": "Sector-12"}
POLICE_LOCATION = {"row": 3, "col": 12, "sector": "Sector-4"}

# River: columns 7-8, all rows
RIVER_COLS = [7, 8]
# Bridges: row 4 (col 7-8), row 8 (col 7-8), row 12 (col 7-8)
BRIDGE_ROWS = [4, 8, 12]

# Elevation map - river at 0, edges higher
def _compute_elevation(row: int, col: int) -> float:
    """Distance-based elevation. River at col 7-8 is lowest."""
    river_dist = min(abs(col - 7), abs(col - 8))
    edge_dist = min(row, GRID_ROWS - 1 - row, col, GRID_COLS - 1 - col)
    base = river_dist * 0.8 + edge_dist * 0.3
    # Add some terrain variation
    variation = ((row * 3 + col * 7) % 5) * 0.2
    return round(max(0.0, base + variation), 1)


def _get_sector_id(row: int, col: int) -> str:
    for name, (r1, r2, c1, c2) in SECTOR_MAP.items():
        if r1 <= row <= r2 and c1 <= col <= c2:
            return name
    return "Unknown"


def _get_land_type(row: int, col: int) -> LandType:
    # River
    if col in RIVER_COLS and row not in BRIDGE_ROWS:
        return LandType.RIVER
    # Bridges
    if col in RIVER_COLS and row in BRIDGE_ROWS:
        return LandType.BRIDGE
    # Special locations
    if row == HOSPITAL_LOCATION["row"] and col == HOSPITAL_LOCATION["col"]:
        return LandType.HOSPITAL
    if row == FIRE_STATION_LOCATION["row"] and col == FIRE_STATION_LOCATION["col"]:
        return LandType.FIRE_STATION
    if row == POLICE_LOCATION["row"] and col == POLICE_LOCATION["col"]:
        return LandType.POLICE
    for s in SHELTER_LOCATIONS:
        if row == s["row"] and col == s["col"]:
            return LandType.SHELTER
    # Parks
    if (row, col) in [(3, 5), (3, 6), (5, 3), (10, 10), (12, 5), (13, 10)]:
        return LandType.PARK
    # Main roads (every 4th row or col)
    if row % 4 == 0 or col % 4 == 0:
        return LandType.ROAD
    return LandType.BUILDING


def _get_population(row: int, col: int, land_type: LandType) -> int:
    if land_type in (LandType.RIVER, LandType.PARK, LandType.ROAD, LandType.BRIDGE):
        return 0
    if land_type == LandType.HOSPITAL:
        return 300
    if land_type == LandType.SHELTER:
        return 50
    # Higher density near center
    center_dist = math.sqrt((row - 8) ** 2 + (col - 8) ** 2)
    base = max(50, int(400 - center_dist * 20))
    variation = ((row * 5 + col * 11) % 100)
    return base + variation


class CityGrid:
    def __init__(self):
        self.grid: List[List[CityCell]] = []
        self.cells_by_sector: Dict[str, List[CityCell]] = {}
        self._build()

    def _build(self):
        for r in range(GRID_ROWS):
            row_cells = []
            for c in range(GRID_COLS):
                land_type = _get_land_type(r, c)
                elevation = _compute_elevation(r, c)
                pop = _get_population(r, c, land_type)
                sector = _get_sector_id(r, c)
                cell = CityCell(
                    row=r, col=c,
                    sector_id=sector,
                    land_type=land_type,
                    elevation=elevation,
                    population_density=pop,
                )
                row_cells.append(cell)
                self.cells_by_sector.setdefault(sector, []).append(cell)
            self.grid.append(row_cells)

    def get_cell(self, row: int, col: int) -> Optional[CityCell]:
        if 0 <= row < GRID_ROWS and 0 <= col < GRID_COLS:
            return self.grid[row][col]
        return None

    def get_all_cells(self) -> List[CityCell]:
        return [cell for row in self.grid for cell in row]

    def get_sector_cells(self, sector_id: str) -> List[CityCell]:
        return self.cells_by_sector.get(sector_id, [])

    def get_sector_flood_level(self, sector_id: str) -> float:
        cells = self.get_sector_cells(sector_id)
        if not cells:
            return 0.0
        return max(c.flood_level for c in cells)

    def get_sector_population(self, sector_id: str) -> int:
        return sum(c.population_density for c in self.get_sector_cells(sector_id))

    def get_flooded_sectors(self) -> List[str]:
        return [
            s for s in SECTOR_MAP
            if self.get_sector_flood_level(s) > 0.3
        ]

    def get_blocked_cells(self) -> List[CityCell]:
        return [c for c in self.get_all_cells() if c.is_blocked]

    def fail_bridge(self, row: int):
        """Mark a bridge row as failed."""
        for col in RIVER_COLS:
            cell = self.get_cell(row, col)
            if cell and cell.is_bridge:
                cell.bridge_failed = True
                cell.is_blocked = True

    def to_geojson(self) -> dict:
        features = []
        for cell in self.get_all_cells():
            # Cell polygon corners
            top_lat = CITY_CENTER_LAT + (GRID_ROWS / 2 - cell.row) * LAT_PER_CELL
            bot_lat = top_lat - LAT_PER_CELL
            left_lng = CITY_CENTER_LNG - (GRID_COLS / 2 - cell.col) * LNG_PER_CELL
            right_lng = left_lng + LNG_PER_CELL
            coords = [
                [left_lng, top_lat], [right_lng, top_lat],
                [right_lng, bot_lat], [left_lng, bot_lat],
                [left_lng, top_lat],
            ]
            features.append({
                "type": "Feature",
                "properties": cell.to_dict(),
                "geometry": {"type": "Polygon", "coordinates": [coords]},
            })
        return {"type": "FeatureCollection", "features": features}

    def to_flood_geojson(self) -> dict:
        """GeoJSON only for flooded cells."""
        features = []
        for cell in self.get_all_cells():
            if cell.flood_level <= 0.05:
                continue
            top_lat = CITY_CENTER_LAT + (GRID_ROWS / 2 - cell.row) * LAT_PER_CELL
            bot_lat = top_lat - LAT_PER_CELL
            left_lng = CITY_CENTER_LNG - (GRID_COLS / 2 - cell.col) * LNG_PER_CELL
            right_lng = left_lng + LNG_PER_CELL
            coords = [
                [left_lng, top_lat], [right_lng, top_lat],
                [right_lng, bot_lat], [left_lng, bot_lat],
                [left_lng, top_lat],
            ]
            features.append({
                "type": "Feature",
                "properties": {
                    "row": cell.row,
                    "col": cell.col,
                    "flood_level": round(cell.flood_level, 2),
                    "sector": cell.sector_id,
                    "lat": round(cell.center_lat, 6),
                    "lng": round(cell.center_lng, 6),
                },
                "geometry": {"type": "Polygon", "coordinates": [coords]},
            })
        return {"type": "FeatureCollection", "features": features}

    def get_state_snapshot(self) -> list:
        return [c.to_dict() for c in self.get_all_cells() if c.flood_level > 0.05 or c.is_blocked]
