"""
Agent 4: Prediction Agent
Predicts future flood spread using simulation lookahead and computer vision expansion metrics.
Generates risk heatmaps, 15m/30m/60m accelerated forecasts, and time-to-impact estimates.
"""
from typing import List, Dict, Tuple, Optional, TYPE_CHECKING
from datetime import datetime
import copy
import uuid

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine
    from ..recon.models import ReconObservation

from ..models.prediction import Prediction
from ..models.agent import AgentDecision, AgentName
from ..simulation.flood import advance_flood
from ..simulation.scenarios import get_rain_rate
from ..simulation.city import SECTOR_MAP, CityGrid

LOOKAHEAD_TICKS = 4
SECONDS_PER_TICK = 30  # simulated minutes per tick

RISK_THRESHOLDS = {
    "extreme": 0.85,
    "high": 0.60,
    "moderate": 0.35,
    "low": 0.15,
}


def _sector_risk(city: CityGrid, sector_id: str) -> float:
    cells = city.get_sector_cells(sector_id)
    if not cells:
        return 0.0
    max_flood = max(c.flood_level for c in cells)
    avg_flood = sum(c.flood_level for c in cells) / len(cells)
    return min(1.0, (max_flood * 0.6 + avg_flood * 0.4) / 3.0)


class PredictionAgent:
    def __init__(self):
        self.name = AgentName.PREDICTOR

    def process(
        self,
        engine: "SimulationEngine",
        recon_obs: Optional["ReconObservation"] = None,
    ) -> Tuple[Prediction, List[AgentDecision]]:
        decisions: List[AgentDecision] = []

        # Deep copy city grid for lookahead (don't mutate real city)
        sim_city = self._clone_city(engine.city)
        sector_max_risks: Dict[str, float] = {}
        tick_predictions = []

        # Incorporate visual velocity boost if expansion is active
        velocity_mult = 1.0
        if recon_obs and recon_obs.estimated_velocity > 0:
            velocity_mult = min(2.0, max(0.8, 1.0 + recon_obs.estimated_velocity * 0.5))

        current_tick = engine.tick
        for future_tick_offset in range(1, LOOKAHEAD_TICKS + 1):
            future_tick = current_tick + future_tick_offset
            rain = get_rain_rate(future_tick) * velocity_mult
            advance_flood(sim_city, rain)

            tick_risks = {}
            for sector_id in SECTOR_MAP:
                risk = _sector_risk(sim_city, sector_id)
                tick_risks[sector_id] = round(risk, 3)
                sector_max_risks[sector_id] = max(
                    sector_max_risks.get(sector_id, 0.0), risk
                )

            # Accelerated horizons: 15m, 30m, 60m
            time_label_min = future_tick_offset * 15

            tick_predictions.append({
                "tick_offset": future_tick_offset,
                "risk_by_sector": tick_risks,
                "minutes_from_now": time_label_min,
            })

        # Sectors at high risk
        high_risk = [s for s, r in sector_max_risks.items() if r >= RISK_THRESHOLDS["high"]]
        extreme_risk = [s for s, r in sector_max_risks.items() if r >= RISK_THRESHOLDS["extreme"]]

        # Time to impact
        current_high = {s for s in SECTOR_MAP if _sector_risk(engine.city, s) >= RISK_THRESHOLDS["high"]}
        new_high = [s for s in high_risk if s not in current_high]
        time_to_impact = 0.0
        if new_high:
            for tp in tick_predictions:
                if any(tp["risk_by_sector"].get(s, 0) >= RISK_THRESHOLDS["high"] for s in new_high):
                    time_to_impact = tp["minutes_from_now"]
                    break

        # Spread direction
        north_risk = sum(sector_max_risks.get(s, 0) for s in ["Sector-1", "Sector-2", "Sector-3", "Sector-4"])
        south_risk = sum(sector_max_risks.get(s, 0) for s in ["Sector-13", "Sector-14", "Sector-15", "Sector-16"])
        east_risk = sum(sector_max_risks.get(s, 0) for s in ["Sector-4", "Sector-8", "Sector-12", "Sector-16"])
        west_risk = sum(sector_max_risks.get(s, 0) for s in ["Sector-1", "Sector-5", "Sector-9", "Sector-13"])
        ns = "North" if north_risk > south_risk else "South"
        ew = "East" if east_risk > west_risk else "West"
        spread_dir = f"{ns}-{ew}" if abs(north_risk - south_risk) > 0.3 else ew

        # Impact radius
        flooded_count = sum(1 for c in engine.city.get_all_cells() if c.flood_level > 0.3)
        impact_radius_km = round((flooded_count * 0.25 * 0.5) / 1000, 2)

        # Population at risk
        pop_at_risk = sum(
            engine.city.get_sector_population(s)
            for s in high_risk
        )

        peak_level = max(
            (sim_city.get_sector_flood_level(s) for s in SECTOR_MAP),
            default=0.0,
        )

        confidence_pct = 85
        if recon_obs:
            confidence_pct = min(96, int((85 + recon_obs.confidence) / 2))

        recon_desc = f" Observed expansion: {recon_obs.expansion_rate:+.1f}%/s, front vel: {recon_obs.estimated_velocity:.2f}m/s." if recon_obs else ""

        prediction = Prediction(
            id=str(uuid.uuid4())[:8],
            affected_sectors=high_risk,
            impact_radius_km=impact_radius_km,
            spread_direction=spread_dir,
            risk_heatmap=sector_max_risks,
            time_to_impact_minutes=round(time_to_impact, 1),
            population_at_risk=pop_at_risk,
            peak_flood_level=round(peak_level, 2),
            next_3_ticks=tick_predictions[:3],
            confidence_pct=confidence_pct,
            description=(
                f"Flood spreading {spread_dir}.{recon_desc} "
                + (f"{len(extreme_risk)} sectors facing EXTREME risk. " if extreme_risk else "")
                + (f"New areas at risk in {time_to_impact:.0f} min. " if time_to_impact > 0 else "")
                + f"{len(high_risk)} sectors high risk, {pop_at_risk:,} people at risk."
            ),
        )

        decisions.append(AgentDecision(
            agent_name=AgentName.PREDICTOR,
            action="Forecast & Risk Heatmap Updated",
            description=f"Flood spreading {spread_dir} — {len(high_risk)} sectors at risk (Confidence: {confidence_pct}%)",
            reasoning=(
                f"Accelerated 15m/30m/60m lookahead simulation integrated with live CV visual telemetry. "
                + (f"Recon expansion rate: {recon_obs.expansion_rate:+.1f}%/s, front velocity: {recon_obs.estimated_velocity:.2f}m/s. " if recon_obs else "")
                + f"Extreme risk zones: {extreme_risk or ['None']}. "
                + f"Predicted time to impact new sectors: {time_to_impact:.0f} min. "
                + f"Population at risk: {pop_at_risk:,}."
            ),
            sop_reference="SOP-002",
            severity="critical" if extreme_risk else ("warning" if high_risk else "info"),
        ))

        return prediction, decisions

    def _clone_city(self, city: CityGrid) -> CityGrid:
        new_city = CityGrid()
        for r in range(len(city.grid)):
            for c in range(len(city.grid[r])):
                src = city.grid[r][c]
                dst = new_city.grid[r][c]
                dst.flood_level = src.flood_level
                dst.is_blocked = src.is_blocked
                dst.bridge_failed = src.bridge_failed
        return new_city
