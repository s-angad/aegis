"""
AEGIS FLOOD v2.0 - Predictor Agent Implementation (Phase 4A)
Projects future flood expansion (15-minute horizon) based on current spatial trajectory.
"""
from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import PredictionResult


class PredictorAgent(BaseAgent):
    name: str = "PREDICTOR"
    version: str = "1.0.0"
    timeout_seconds: float = 5.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        recon_result = context.agent_results.get("RECON", {}).get("result", {})
        verifier_result = context.agent_results.get("VERIFIER", {}).get("result", {})

        current_coverage = float(recon_result.get("flood_coverage", 0.0))
        affected_sectors = recon_result.get("affected_sectors", [])
        newly_affected = verifier_result.get("newly_affected_sectors", [])

        # Extrapolate 15-minute horizon flood expansion
        expansion_rate = len(newly_affected) * 1.5 if newly_affected else 0.5
        predicted_coverage = min(100.0, current_coverage + expansion_rate * 3.0)

        predicted_sectors = list(affected_sectors)
        # Add downstream neighbor sectors
        neighbor_map = {
            "S2": ["S6"], "S6": ["S7"], "S7": ["S8", "S11"],
            "S10": ["S11", "S14"], "S11": ["S12", "S15"]
        }
        for s in affected_sectors:
            for n in neighbor_map.get(s, []):
                if n not in predicted_sectors:
                    predicted_sectors.append(n)

        risk_levels = {}
        for s_num in range(1, 17):
            s_id = f"S{s_num}"
            if s_id in affected_sectors:
                risk_levels[s_id] = "HIGH"
            elif s_id in predicted_sectors:
                risk_levels[s_id] = "ELEVATED"
            else:
                risk_levels[s_id] = "LOW"

        assumptions = [
            "Baseline flood progression rate extrapolated from Frame N-1 to Frame N delta.",
            "Topography assumes gravity flow towards central river channel (S2 -> S6 -> S7 -> S11)."
        ]

        p_confidence = 0.85

        if current_coverage <= 0.5 and not affected_sectors:
            current_risk = "NORMAL"
            predicted_coverage = 0.0
            predicted_sectors = []
            predicted_expansion = 0.0
        else:
            current_risk = "CRITICAL" if current_coverage > 40 else ("HIGH" if current_coverage > 15 else "MEDIUM")
            predicted_expansion = round(len(newly_affected) * 4.2, 1) if newly_affected else 0.0

        prediction_contract = PredictionResult(
            horizon_seconds=900.0,
            predicted_sectors=predicted_sectors,
            predicted_flood_coverage=round(predicted_coverage, 1),
            risk_levels=risk_levels,
            confidence=p_confidence,
            model_version="spatial-trend-extrapolation-v1",
            assumptions=assumptions
        )

        output = prediction_contract.model_dump(mode="json")
        output.update({
            "agent": "predictor",
            "status": "complete",
            "source": "TREND_PREDICTION",
            "source_frame": context.frame_id,
            "timestamp": context.timestamp,
            "current_risk": current_risk,
            "predicted_sectors": predicted_sectors,
            "prediction_horizon_seconds": 900,
            "predicted_flood_expansion_percent": predicted_expansion,
            "confidence": p_confidence,
            "_confidence": p_confidence
        })
        return output
