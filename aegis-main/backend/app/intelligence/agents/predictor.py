from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import PredictionResult, GPTPredictorOutput
from ..services.openai_service import openai_agent_service

PREDICTOR_SYSTEM_PROMPT = """You are AEGIS FLOOD Predictor Agent.
You forecast near-term flood evolution.
You may reason about:
- observed flood progression
- rate of coverage change
- newly affected sectors
- connected sectors
- known topology
- road/bridge constraints
- historical frames
Do NOT invent future events.
If the system is currently dry and there is insufficient evidence of active flooding, return:
prediction_status = NO_ACTIVE_FLOOD
Do not generate arbitrary flood growth percentages.
Clearly distinguish OBSERVED from PREDICTED.
Predictions are forecasts, not measurements."""


class PredictorAgent(BaseAgent):
    name: str = "PREDICTOR"
    version: str = "1.0.0"
    timeout_seconds: float = 30.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        obs = context.observation or {}
        obs_id = obs.get("observation_id", f"OBS-{context.frame_id}")
        recon_result = context.agent_results.get("RECON", {}).get("result", {})
        verifier_result = context.agent_results.get("VERIFIER", {}).get("result", {})

        current_coverage = float(recon_result.get("flood_coverage", 0.0))
        affected_sectors = recon_result.get("affected_sectors", [])
        newly_affected = verifier_result.get("newly_affected_sectors", [])

        # 1. REAL MODE: Attempt GPT-5.6 Luna Execution
        if openai_agent_service.is_available():
            gpt_payload = {
                "observation_id": obs_id,
                "frame_id": context.frame_id,
                "current_coverage_percent": current_coverage,
                "affected_sectors": affected_sectors,
                "newly_affected_sectors": newly_affected,
                "recon_result": recon_result,
                "verifier_result": verifier_result,
                "topology_flow": "S2 -> S6 -> S7 -> S11 -> S15"
            }

            gpt_out, meta = await openai_agent_service.call_agent(
                agent_name=self.name,
                system_prompt=PREDICTOR_SYSTEM_PROMPT,
                user_payload=gpt_payload,
                response_schema=GPTPredictorOutput,
                frame_id=context.frame_id,
                observation_id=obs_id
            )

            if gpt_out:
                res_dict = gpt_out.model_dump(mode="json")
                res_dict.update({
                    "agent": "predictor",
                    "status": "complete",
                    "prediction_status": gpt_out.prediction_status,
                    "prediction_summary": gpt_out.summary,
                    "current_risk": gpt_out.projected_risk,
                    "projected_risk": gpt_out.projected_risk,
                    "predicted_sectors": gpt_out.projected_sectors,
                    "predicted_flood_coverage": current_coverage + (len(gpt_out.projected_sectors) * 2.5),
                    "predicted_flood_expansion_percent": len(gpt_out.projected_sectors) * 2.5,
                    "confidence": gpt_out.confidence,
                    "_confidence": gpt_out.confidence,
                    "source": "GPT_5_6_LUNA",
                    "source_frame": context.frame_id,
                    "source_observation_id": obs_id,
                    "model": openai_agent_service.model,
                    "meta": meta
                })
                return res_dict

        # 2. SIMULATION MODE or API Fallback Execution
        if current_coverage <= 0.5 and not affected_sectors:
            current_risk = "NORMAL"
            predicted_coverage = 0.0
            predicted_sectors = []
            predicted_expansion = 0.0
            p_status = "NO_ACTIVE_FLOOD"
        else:
            current_risk = "CRITICAL" if current_coverage > 40 else ("HIGH" if current_coverage > 15 else "MEDIUM")
            predicted_expansion = round(len(newly_affected) * 4.2, 1) if newly_affected else 0.0
            predicted_coverage = min(100.0, current_coverage + predicted_expansion)
            predicted_sectors = list(affected_sectors)
            p_status = "ESCALATING" if newly_affected else "STABLE"

        prediction_contract = PredictionResult(
            horizon_seconds=900.0,
            predicted_sectors=predicted_sectors,
            predicted_flood_coverage=round(predicted_coverage, 1),
            confidence=0.85,
            model_version="SIMULATION-trend-v1"
        )

        output = prediction_contract.model_dump(mode="json")
        output.update({
            "agent": "predictor",
            "status": "complete",
            "prediction_status": p_status,
            "summary": f"Spatial forecast: {p_status} (Risk: {current_risk})",
            "source": "TREND_PREDICTION",
            "source_frame": context.frame_id,
            "source_observation_id": obs_id,
            "model": "SIMULATION",
            "timestamp": context.timestamp,
            "current_risk": current_risk,
            "projected_risk": current_risk,
            "predicted_sectors": predicted_sectors,
            "prediction_horizon_seconds": 900,
            "predicted_flood_expansion_percent": predicted_expansion,
            "confidence": 0.85,
            "_confidence": 0.85
        })
        return output
