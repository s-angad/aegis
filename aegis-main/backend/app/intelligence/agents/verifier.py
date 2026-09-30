from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import VerificationResult, GPTVerifierOutput
from ..services.openai_service import openai_agent_service

VERIFIER_SYSTEM_PROMPT = """You are AEGIS FLOOD Verifier Agent.
Your responsibility is temporal and logical consistency checking.
Compare:
- current PhysicalObservation
- previous PhysicalObservation
- Recon result
Identify:
- newly affected sectors
- recovered sectors
- changed flood coverage
- inconsistent claims
- sudden impossible state changes
- contradictions between agents and physical observation
PhysicalObservation is authoritative.
If Recon claims something that PhysicalObservation does not support, flag the contradiction.
Do not silently modify the physical observation."""


class VerifierAgent(BaseAgent):
    name: str = "VERIFIER"
    version: str = "1.0.0"
    timeout_seconds: float = 30.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        obs = context.observation or {}
        obs_id = obs.get("observation_id", f"OBS-{context.frame_id}")
        change_data = obs.get("change", {})
        quality_data = obs.get("quality", {})

        recon_result = context.agent_results.get("RECON", {}).get("result", {})
        coverage = float(recon_result.get("flood_coverage", 0.0))

        newly_affected = change_data.get("newly_affected_sectors", [])
        coverage_delta = float(change_data.get("coverage_delta", 0.0))

        # 1. REAL MODE: Attempt GPT-5.6 Luna Execution
        if openai_agent_service.is_available():
            gpt_payload = {
                "observation_id": obs_id,
                "frame_id": context.frame_id,
                "current_observation": {
                    "flood_coverage_percent": coverage,
                    "affected_sectors": recon_result.get("affected_sectors", [])
                },
                "previous_observation": context.previous_observation or {},
                "recon_result": recon_result,
                "coverage_delta": coverage_delta,
                "newly_affected_sectors": newly_affected
            }

            gpt_out, meta = await openai_agent_service.call_agent(
                agent_name=self.name,
                system_prompt=VERIFIER_SYSTEM_PROMPT,
                user_payload=gpt_payload,
                response_schema=GPTVerifierOutput,
                frame_id=context.frame_id,
                observation_id=obs_id
            )

            if gpt_out:
                res_dict = gpt_out.model_dump(mode="json")
                res_dict.update({
                    "agent": "verifier",
                    "status": "complete",
                    "verified": gpt_out.verification_status == "PASS",
                    "verification_status": gpt_out.verification_status,
                    "verification_summary": gpt_out.summary,
                    "severity": gpt_out.severity,
                    "newly_affected_sectors": gpt_out.newly_affected_sectors if gpt_out.newly_affected_sectors else newly_affected,
                    "recovered_sectors": gpt_out.recovered_sectors,
                    "contradictions": gpt_out.contradictions,
                    "flood_change_percent": round(coverage_delta, 1),
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
        anomalies = []
        inconsistencies = []

        if not quality_data.get("image_valid", True):
            inconsistencies.append("Image corruption flag set in Phase 3 quality check")
        if not quality_data.get("calibration_valid", True):
            anomalies.append("Perspective calibration warning: using fallback warp")

        if abs(coverage_delta) > 40.0:
            anomalies.append(f"HIGH_SURGE_ANOMALY: Coverage delta {coverage_delta:+.1f}% in single frame interval")

        verified = len(inconsistencies) == 0
        v_confidence = 0.96 if verified else 0.70
        severity = "HIGH" if coverage > 30 or len(newly_affected) > 2 else ("MEDIUM" if coverage > 5 else "NORMAL")

        verification_contract = VerificationResult(
            verified=verified,
            confidence=v_confidence,
            newly_affected_sectors=newly_affected,
            anomalies=anomalies,
            inconsistencies=inconsistencies,
            evidence=[f"Frame {context.frame_id} verified.", f"Coverage Delta: {coverage_delta:+.1f}%."],
            verification_summary=f"Verification {'PASSED' if verified else 'WARNING'}"
        )

        output = verification_contract.model_dump(mode="json")
        output.update({
            "agent": "verifier",
            "status": "complete",
            "verification_status": "PASS" if verified else "WARNING",
            "summary": output.get("verification_summary", ""),
            "source": "RECON_VERIFICATION",
            "source_frame": context.frame_id,
            "source_observation_id": obs_id,
            "model": "SIMULATION",
            "timestamp": context.timestamp,
            "verified": verified,
            "severity": severity,
            "newly_affected_sectors": newly_affected,
            "recovered_sectors": [],
            "contradictions": inconsistencies,
            "flood_change_percent": round(coverage_delta, 1),
            "observation_consistency": v_confidence,
            "anomaly_detected": len(anomalies) > 0,
            "confidence": v_confidence,
            "_confidence": v_confidence
        })
        return output
