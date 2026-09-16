"""
AEGIS FLOOD v2.0 - Ground Truth Physical Model (16-Sector Grid & Infrastructure)
"""
from typing import Dict, List, Any, Tuple


class GroundTruthCity:
    """
    Formal representation of the physical 16-sector testbed city grid (4x4).
    Grid:
    S1  S2  S3  S4
    S5  S6  S7  S8
    S9  S10 S11 S12
    S13 S14 S15 S16
    """

    def __init__(self, rectified_size: Tuple[int, int] = (800, 800)):
        self.width, self.height = rectified_size
        self.cols = 4
        self.rows = 4
        self.cell_w = self.width / float(self.cols)
        self.cell_h = self.height / float(self.rows)

        self.sectors: Dict[str, Dict[str, Any]] = self._build_sector_grid()
        self.infrastructure: Dict[str, Any] = self._build_infrastructure_model()

    def _build_sector_grid(self) -> Dict[str, Dict[str, Any]]:
        sectors = {}
        for r in range(self.rows):
            for c in range(self.cols):
                sector_num = r * 4 + c + 1
                sector_id = f"S{sector_num}"

                x1, y1 = c * self.cell_w, r * self.cell_h
                x2, y2 = (c + 1) * self.cell_w, (r + 1) * self.cell_h
                center = (x1 + self.cell_w / 2.0, y1 + self.cell_h / 2.0)

                # Compute neighbors
                neighbors = []
                if r > 0: neighbors.append(f"S{(r-1)*4 + c + 1}")
                if r < 3: neighbors.append(f"S{(r+1)*4 + c + 1}")
                if c > 0: neighbors.append(f"S{r*4 + (c-1) + 1}")
                if c < 3: neighbors.append(f"S{r*4 + (c+1) + 1}")

                # Risk level baseline
                risk_level = "CRITICAL" if sector_num in [2, 3, 6, 7, 10, 11] else "HIGH" if sector_num in [4, 8, 12] else "MEDIUM"

                sectors[sector_id] = {
                    "sector_id": sector_id,
                    "row": r,
                    "column": c,
                    "x1": int(x1),
                    "y1": int(y1),
                    "x2": int(x2),
                    "y2": int(y2),
                    "boundary": [
                        [int(x1), int(y1)],
                        [int(x2), int(y1)],
                        [int(x2), int(y2)],
                        [int(x1), int(y2)]
                    ],
                    "center": center,
                    "neighbors": neighbors,
                    "risk_level": risk_level,
                }
        return sectors

    def _build_infrastructure_model(self) -> Dict[str, Any]:
        """Physical infrastructure entities mapped to 800x800 normalized space."""
        cw, ch = self.cell_w, self.cell_h

        # River path flowing through S2 -> S6 -> S7 -> S11 -> S15
        river = {
            "id": "RIVER-01",
            "name": "Main City River Channel",
            "sectors": ["S2", "S6", "S7", "S11", "S15"],
            "entry_point": "S2-TOP",
            "bounding_boxes": [
                {"sector": "S2", "box": [int(1.2 * cw), int(0 * ch), int(1.8 * cw), int(1 * ch)]},
                {"sector": "S6", "box": [int(1.4 * cw), int(1 * ch), int(2.0 * cw), int(2 * ch)]},
                {"sector": "S7", "box": [int(2.0 * cw), int(1.2 * ch), int(3.0 * cw), int(1.8 * ch)]},
                {"sector": "S11", "box": [int(2.2 * cw), int(2 * ch), int(2.8 * cw), int(3 * ch)]},
                {"sector": "S15", "box": [int(2.3 * cw), int(3 * ch), int(2.9 * cw), int(4 * ch)]},
            ]
        }

        # Central Bridge spanning river in S7
        bridge = {
            "id": "BRIDGE-01",
            "name": "Central Crossing Bridge",
            "sector": "S7",
            "box": [int(2.1 * cw), int(1.4 * ch), int(2.9 * cw), int(1.6 * ch)]
        }

        # Roads (Grid network)
        roads = []
        for s_id, s_data in self.sectors.items():
            r, c = s_data["row"], s_data["column"]
            x1, y1, x2, y2 = s_data["x1"], s_data["y1"], s_data["x2"], s_data["y2"]
            
            # Horizontal road segment through center of sector
            roads.append({
                "id": f"ROAD-H-{s_id}",
                "sector": s_id,
                "name": f"Arterial Road H-{s_id}",
                "box": [int(x1), int(y1 + 0.45 * ch), int(x2), int(y1 + 0.55 * ch)]
            })
            # Vertical road segment through center of sector
            roads.append({
                "id": f"ROAD-V-{s_id}",
                "sector": s_id,
                "name": f"Arterial Road V-{s_id}",
                "box": [int(x1 + 0.45 * cw), int(y1), int(x1 + 0.55 * cw), int(y2)]
            })

        # Key Buildings
        buildings = [
            {"id": "HOSPITAL-01", "name": "Central General Hospital", "sector": "S6", "box": [int(1.1 * cw), int(1.1 * ch), int(1.4 * cw), int(1.4 * ch)]},
            {"id": "SHELTER-01", "name": "North Safehouse", "sector": "S1", "box": [int(0.2 * cw), int(0.2 * ch), int(0.6 * cw), int(0.6 * ch)]},
            {"id": "SHELTER-02", "name": "South Safehouse", "sector": "S16", "box": [int(3.2 * cw), int(3.2 * ch), int(3.7 * cw), int(3.7 * ch)]},
            {"id": "EOC-BUILDING-01", "name": "Emergency Command HQ", "sector": "S4", "box": [int(3.1 * cw), int(0.2 * ch), int(3.6 * cw), int(0.6 * ch)]},
        ]

        # General residential & commercial buildings per sector
        b_count = 1
        for s_id, s_data in self.sectors.items():
            x1, y1 = s_data["x1"], s_data["y1"]
            buildings.append({
                "id": f"B{b_count:03d}",
                "name": f"Structure {b_count:03d} ({s_id})",
                "sector": s_id,
                "box": [int(x1 + 0.15 * cw), int(y1 + 0.15 * ch), int(x1 + 0.4 * cw), int(y1 + 0.4 * ch)]
            })
            b_count += 1

        return {
            "river": river,
            "bridge": bridge,
            "roads": roads,
            "buildings": buildings
        }


ground_truth_city = GroundTruthCity()
