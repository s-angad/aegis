"""
AEGIS FLOOD v2.0 - Verifier Agent Implementation (Phase 4A)
Validates Recon observation against temporal change data and previous frames.
"""
from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import VerificationResult


class VerifierAgent(BaseAgent):
    name: str = "VERIFIER"
    version: str = "1.0.0"
    timeout_seconds: float = 5.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        obs = context.observation or {}
        change_data = obs.get("change", {})
        quality_data = obs.get("quality", {})

        recon_result = context.agent_results.get("RECON", {}).get("result", {})
        coverage = float(recon_result.get("flood_coverage", 0.0))

        newly_affected = change_data.get("newly_affected_sectors", [])
        coverage_delta = float(change_data.get("coverage_delta", 0.0))

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

        evidence = [
            f"Frame {context.frame_id} verified against Frame N-1 temporal buffer.",
            f"Coverage Delta: {coverage_delta:+.1f}%.",
            f"Newly affected sectors: {', '.join(newly_affected) if newly_affected else 'None'}."
        ]

        summary = f"Verification {'PASSED' if verified else 'WARNING'}: {len(anomalies)} anomalies, {len(inconsistencies)} inconsistencies detected."

        verification_contract = VerificationResult(
            verified=verified,
            confidence=v_confidence,
            newly_affected_sectors=newly_affected,
            anomalies=anomalies,
            inconsistencies=inconsistencies,
            evidence=evidence,
            verification_summary=summary
        )

        severity = "HIGH" if coverage > 30 or len(newly_affected) > 2 else ("MEDIUM" if coverage > 5 else "NORMAL")

        output = verification_contract.model_dump(mode="json")
        output.update({
            "agent": "verifier",
            "status": "complete",
            "source": "RECON_VERIFICATION",
            "source_frame": context.frame_id,
            "timestamp": context.timestamp,
            "verified": verified,
            "severity": severity,
            "newly_affected_sectors": newly_affected,
            "flood_change_percent": round(coverage_delta, 1),
            "observation_consistency": v_confidence,
            "anomaly_detected": len(anomalies) > 0,
            "confidence": v_confidence,
            "_confidence": v_confidence
        })
        return output
