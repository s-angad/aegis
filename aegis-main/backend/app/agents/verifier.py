"""
Agent 2: Verification Agent
Validates incidents, performs sensor fusion with visual recon, removes duplicates, cross-checks sources, boosts confidence.
"""
from typing import List, Dict, Tuple, Optional, TYPE_CHECKING
from datetime import datetime, timedelta

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine
    from ..recon.models import ReconObservation

from ..models.incident import Incident
from ..models.agent import AgentDecision, AgentName

DEDUP_RADIUS_DEG = 0.003   # ~330m
DEDUP_TIME_WINDOW = 120    # seconds
MIN_CONFIDENCE = 40        # below this: discard


class VerificationAgent:
    def __init__(self):
        self.name = AgentName.VERIFIER
        self.verified_incident_ids: set = set()

    def process(
        self,
        raw_incidents: List[Incident],
        existing_verified: List[Incident],
        engine: "SimulationEngine",
        recon_obs: Optional["ReconObservation"] = None,
    ) -> Tuple[List[Incident], List[AgentDecision]]:
        decisions: List[AgentDecision] = []
        verified: List[Incident] = []
        removed_dupes = 0
        removed_false = 0
        visually_confirmed_count = 0

        # Extract visually affected sectors from Recon Observation
        recon_sectors = set()
        if recon_obs and recon_obs.affected_cells:
            recon_sectors = {c.get("sector", "") for c in recon_obs.affected_cells if c.get("sector")}

        # Group by sector
        sector_groups: Dict[str, List[Incident]] = {}
        for inc in raw_incidents:
            sector_groups.setdefault(inc.sector, []).append(inc)

        for sector, group in sector_groups.items():
            # Cross-reference: multiple reports from same sector boost confidence
            source_types = {i.source for i in group}
            cross_ref_boost = min(len(source_types) * 8, 20)
            
            # Recon visual confirmation boost (+15%)
            is_visually_confirmed = sector in recon_sectors
            recon_boost = 15 if is_visually_confirmed else 0

            # Dedup: find spatial/temporal duplicates
            seen_positions: List[Tuple[float, float, datetime]] = []
            for inc in group:
                # Check against existing verified incidents first
                is_existing_dup = any(
                    self._is_duplicate(inc, e) for e in existing_verified
                )
                if is_existing_dup:
                    removed_dupes += 1
                    continue

                # Check for spatial/temporal duplicates within this batch
                is_batch_dup = any(
                    abs(inc.lat - slat) < DEDUP_RADIUS_DEG and
                    abs(inc.lng - slng) < DEDUP_RADIUS_DEG and
                    abs((inc.timestamp - st).total_seconds()) < DEDUP_TIME_WINDOW
                    for slat, slng, st in seen_positions
                )
                if is_batch_dup:
                    # Duplicate confirms event - boost confidence of existing
                    removed_dupes += 1
                    for v in verified:
                        if v.sector == sector:
                            v.confidence = min(98, v.confidence + 5)
                    continue

                # Check confidence
                adjusted_conf = min(98, inc.confidence + cross_ref_boost + recon_boost)
                inc.confidence = adjusted_conf

                if adjusted_conf < MIN_CONFIDENCE:
                    removed_false += 1
                    continue

                inc.verified = True
                if is_visually_confirmed:
                    visually_confirmed_count += 1

                verified.append(inc)
                self.verified_incident_ids.add(inc.id)
                seen_positions.append((inc.lat, inc.lng, inc.timestamp))

        total_in = len(raw_incidents)
        total_out = len(verified)

        if total_in > 0 or visually_confirmed_count > 0:
            decisions.append(AgentDecision(
                agent_name=AgentName.VERIFIER,
                action="Sensor Fusion & Verification Complete",
                description=f"{total_out}/{total_in} incidents verified" + (f" ({visually_confirmed_count} visually confirmed via Recon CV)" if visually_confirmed_count else ""),
                reasoning=(
                    f"Sensor Fusion executed: Cross-checked incoming distress calls against "
                    f"aerial frame reconnaissance ({len(recon_sectors)} sectors visually flooded). "
                    f"Removed {removed_dupes} duplicates using spatial deduplication radius. "
                    f"Filtered {removed_false} false reports. "
                    f"Visually confirmed {visually_confirmed_count} sector events with confidence boost."
                ),
                sop_reference="SOP-001",
                severity="info" if total_out < 3 else "warning",
            ))

        return verified, decisions

    def _is_duplicate(self, inc: Incident, existing: Incident) -> bool:
        lat_match = abs(inc.lat - existing.lat) < DEDUP_RADIUS_DEG
        lng_match = abs(inc.lng - existing.lng) < DEDUP_RADIUS_DEG
        sector_match = inc.sector == existing.sector
        type_match = inc.type == existing.type
        return (lat_match and lng_match) or (sector_match and type_match)
