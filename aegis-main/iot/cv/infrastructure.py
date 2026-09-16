"""
AEGIS FLOOD v2.0 - Infrastructure Impact Assessment Module
"""
from typing import List, Dict, Any, Tuple
import cv2
import numpy as np

from .ground_truth import ground_truth_city
from .schema import RoadStatus, BridgeStatus, BuildingStatus, InfrastructureObservation


class InfrastructureAnalyzer:
    """
    Maps detected water segmentation mask against ground-truth physical infrastructure geometry
    to compute individual statuses for roads, bridges, and buildings.
    """

    def __init__(self, city=ground_truth_city):
        self.city = city

    def evaluate(self, flood_mask: np.ndarray) -> InfrastructureObservation:
        """
        Evaluates flood mask against all known ground truth infrastructure entities.
        """
        roads_status = self._evaluate_roads(flood_mask)
        bridge_status = self._evaluate_bridge(flood_mask)
        buildings_status = self._evaluate_buildings(flood_mask)

        return InfrastructureObservation(
            roads=roads_status,
            bridges=[bridge_status],
            buildings=buildings_status
        )

    def _evaluate_roads(self, flood_mask: np.ndarray) -> List[RoadStatus]:
        road_statuses = []
        for r_info in self.city.infrastructure["roads"]:
            r_id = r_info["id"]
            sector = r_info["sector"]
            x1, y1, x2, y2 = r_info["box"]

            roi = flood_mask[y1:y2, x1:x2]
            if roi.size > 0:
                flood_px = cv2.countNonZero(roi)
                overlap_pct = round((flood_px / float(roi.size)) * 100.0, 1)
            else:
                overlap_pct = 0.0

            status = "BLOCKED" if overlap_pct >= 30.0 else "OPEN"

            road_statuses.append(RoadStatus(
                road_id=r_id,
                sector=sector,
                status=status,
                flood_overlap_percent=overlap_pct,
                detected_by_cv=True,
                derived_from_ground_truth=True
            ))
        return road_statuses

    def _evaluate_bridge(self, flood_mask: np.ndarray) -> BridgeStatus:
        b_info = self.city.infrastructure["bridge"]
        b_id = b_info["id"]
        sector = b_info["sector"]
        x1, y1, x2, y2 = b_info["box"]

        roi = flood_mask[y1:y2, x1:x2]
        if roi.size > 0:
            flood_px = cv2.countNonZero(roi)
            overlap_pct = round((flood_px / float(roi.size)) * 100.0, 1)
        else:
            overlap_pct = 0.0

        if overlap_pct < 10.0:
            status = "OPEN"
        elif overlap_pct < 35.0:
            status = "AT_RISK"
        elif overlap_pct < 70.0:
            status = "BLOCKED"
        else:
            status = "FAILED"

        return BridgeStatus(
            bridge_id=b_id,
            sector=sector,
            status=status,
            flood_overlap_percent=overlap_pct,
            detected_by_cv=True,
            derived_from_ground_truth=True
        )

    def _evaluate_buildings(self, flood_mask: np.ndarray) -> List[BuildingStatus]:
        b_statuses = []
        for b_info in self.city.infrastructure["buildings"]:
            b_id = b_info["id"]
            name = b_info["name"]
            sector = b_info["sector"]
            x1, y1, x2, y2 = b_info["box"]

            roi = flood_mask[y1:y2, x1:x2]
            if roi.size > 0:
                flood_px = cv2.countNonZero(roi)
                overlap_pct = round((flood_px / float(roi.size)) * 100.0, 1)
            else:
                overlap_pct = 0.0

            if overlap_pct < 5.0:
                status = "DRY"
            elif overlap_pct < 25.0:
                status = "AFFECTED"
            elif overlap_pct < 60.0:
                status = "FLOODED"
            else:
                status = "SEVERELY_FLOODED"

            b_statuses.append(BuildingStatus(
                building_id=b_id,
                sector=sector,
                name=name,
                status=status,
                flood_overlap_percent=overlap_pct,
                detected_by_cv=True,
                derived_from_ground_truth=True
            ))
        return b_statuses


infrastructure_analyzer = InfrastructureAnalyzer()
