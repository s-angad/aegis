"""
AEGIS FLOOD v2.0 - Recon Agent Implementation (Phase 4A)
Extracts situation summary, affected sectors, and infrastructure from Phase 3 observation.
"""
from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import ReconResult


class ReconAgent(BaseAgent):
    name: str = "RECON"
    version: str = "1.0.0"
    timeout_seconds: float = 5.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        obs = context.observation or {}
        flood_data = obs.get("flood", {})
        sectors_data = obs.get("sectors", [])
        infra_data = obs.get("infrastructure", {})

        coverage_pct = float(flood_data.get("coverage_percent", 0.0))
        obs_confidence = float(flood_data.get("confidence", 94.0)) / 100.0

        affected_sectors = [s["sector_id"] for s in sectors_data if s.get("status") != "DRY"]
        critical_sectors = [s["sector_id"] for s in sectors_data if s.get("status") == "SEVERELY_FLOODED"]

        affected_infra = []
        # Roads
        for r in infra_data.get("roads", []):
            if r.get("status") == "BLOCKED":
                affected_infra.append(f"ROAD:{r.get('road_id')}")
        # Bridges
        for b in infra_data.get("bridges", []):
            if b.get("status") in ["BLOCKED", "FAILED", "AT_RISK"]:
                affected_infra.append(f"BRIDGE:{b.get('bridge_id')} ({b.get('status')})")

        summary = (
            f"Aerial Recon: {len(affected_sectors)}/16 sectors affected, "
            f"overall flood coverage {coverage_pct:.1f}%. "
            f"Critical sectors: {', '.join(critical_sectors) if critical_sectors else 'None'}."
        )

        observations = [
            f"Frame {context.frame_id} evaluated with Phase 3 CV.",
            f"Total flood coverage measured at {coverage_pct:.1f}%.",
            f"Detected {len(affected_infra)} impacted infrastructure items."
        ]

        blocked_roads = [r.get("road_id") for r in infra_data.get("roads", []) if r.get("status") == "BLOCKED"]
        bridge_stat = (infra_data.get("bridges", [{}])[0].get("status") if infra_data.get("bridges") else "OPEN")

        recon_contract = ReconResult(
            situation_summary=summary,
            affected_sectors=affected_sectors,
            critical_sectors=critical_sectors,
            affected_infrastructure=affected_infra,
            flood_coverage=coverage_pct,
            confidence=round(obs_confidence, 2),
            observations=observations,
            warnings=[]
        )

        output = recon_contract.model_dump(mode="json")
        output.update({
            "agent": "recon",
            "status": "complete",
            "source": "PHYSICAL_OBSERVATION",
            "source_frame": context.frame_id,
            "timestamp": context.timestamp,
            "flood_detected": coverage_pct > 0.5,
            "flood_coverage_percent": coverage_pct,
            "affected_sectors": affected_sectors,
            "critical_sectors": critical_sectors,
            "blocked_roads": blocked_roads,
            "bridge_status": bridge_stat,
            "affected_buildings": len(affected_sectors) * 6 if affected_sectors else 0,
            "confidence": round(obs_confidence, 2),
            "_confidence": round(obs_confidence, 2)
        })
        return output
