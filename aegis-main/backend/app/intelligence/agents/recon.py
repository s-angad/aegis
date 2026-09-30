from typing import Dict, Any
from .base import BaseAgent
from ..schemas.context import AgentContext
from ..schemas.contracts import ReconResult, GPTReconOutput
from ..services.openai_service import openai_agent_service

RECON_SYSTEM_PROMPT = """You are AEGIS FLOOD Recon Agent.
Your responsibility is situational interpretation.
You receive a machine-generated PhysicalObservation from the physical testbed perception system.
Treat PhysicalObservation as ground truth.
Do not invent measurements.
Do not create flooded sectors that are absent from the observation.
Do not modify flood coverage.
Do not infer a bridge failure unless supplied.
If no flooding is detected, explicitly report NORMAL / NO ACTIVE FLOOD.
Your output must summarize:
- current flood state
- affected sectors
- affected infrastructure
- severity
- key observations
- uncertainties
Never override the physical observation."""


class ReconAgent(BaseAgent):
    name: str = "RECON"
    version: str = "1.0.0"
    timeout_seconds: float = 30.0
    max_retries: int = 2

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        obs = context.observation or {}
        obs_id = obs.get("observation_id", f"OBS-{context.frame_id}")
        flood_data = obs.get("flood", {})
        sectors_data = obs.get("sectors", [])
        infra_data = obs.get("infrastructure", {})

        coverage_pct = float(flood_data.get("coverage_percent", 0.0))
        obs_confidence = float(flood_data.get("confidence", 96.0)) / 100.0

        affected_sectors = [s["sector_id"] for s in sectors_data if s.get("status") != "DRY"]
        critical_sectors = [s["sector_id"] for s in sectors_data if s.get("status") == "SEVERELY_FLOODED"]
        blocked_roads = [r.get("road_id") for r in infra_data.get("roads", []) if r.get("status") == "BLOCKED"]
        bridge_stat = (infra_data.get("bridges", [{}])[0].get("status") if infra_data.get("bridges") else "OPEN")

        # 1. REAL MODE: Attempt GPT-5.6 Luna Execution
        if openai_agent_service.is_available():
            gpt_payload = {
                "observation_id": obs_id,
                "frame_id": context.frame_id,
                "flood_detected": coverage_pct > 0.5,
                "flood_coverage_percent": coverage_pct,
                "affected_sectors": affected_sectors,
                "critical_sectors": critical_sectors,
                "blocked_roads": blocked_roads,
                "bridge_status": bridge_stat,
                "perception": obs.get("perception", {})
            }

            gpt_out, meta = await openai_agent_service.call_agent(
                agent_name=self.name,
                system_prompt=RECON_SYSTEM_PROMPT,
                user_payload=gpt_payload,
                response_schema=GPTReconOutput,
                frame_id=context.frame_id,
                observation_id=obs_id
            )

            if gpt_out:
                res_dict = gpt_out.model_dump(mode="json")
                res_dict.update({
                    "agent": "recon",
                    "status": gpt_out.status,
                    "situation_summary": gpt_out.summary,
                    "flood_coverage": coverage_pct,
                    "flood_coverage_percent": coverage_pct,
                    "affected_sectors": gpt_out.affected_sectors if gpt_out.affected_sectors else affected_sectors,
                    "affected_infrastructure": gpt_out.affected_infrastructure,
                    "blocked_roads": blocked_roads,
                    "bridge_status": bridge_stat,
                    "affected_buildings": len(affected_sectors) * 6 if affected_sectors else 0,
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
        affected_infra = []
        for r in infra_data.get("roads", []):
            if r.get("status") == "BLOCKED":
                affected_infra.append(f"ROAD:{r.get('road_id')}")
        for b in infra_data.get("bridges", []):
            if b.get("status") in ["BLOCKED", "FAILED", "AT_RISK"]:
                affected_infra.append(f"BRIDGE:{b.get('bridge_id')} ({b.get('status')})")

        summary = (
            f"Aerial Recon: {len(affected_sectors)}/16 sectors affected, "
            f"overall flood coverage {coverage_pct:.1f}%. "
            f"Critical sectors: {', '.join(critical_sectors) if critical_sectors else 'None'}."
        ) if coverage_pct > 0.5 else "✓ NO FLOOD DETECTED | Coverage: 0.0% | All sectors clear."

        recon_contract = ReconResult(
            situation_summary=summary,
            affected_sectors=affected_sectors,
            critical_sectors=critical_sectors,
            affected_infrastructure=affected_infra,
            flood_coverage=coverage_pct,
            confidence=round(obs_confidence, 2),
            observations=[f"Frame {context.frame_id} evaluated.", f"Coverage measured at {coverage_pct:.1f}%."],
            warnings=[]
        )

        output = recon_contract.model_dump(mode="json")
        output.update({
            "agent": "recon",
            "status": "CRITICAL" if critical_sectors else ("ALERT" if affected_sectors else "NORMAL"),
            "summary": summary,
            "source": "PHYSICAL_OBSERVATION",
            "source_frame": context.frame_id,
            "source_observation_id": obs_id,
            "model": "SIMULATION",
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
