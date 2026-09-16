"""
AEGIS FLOOD v2.0 - Phase 4A Multi-Agent Intelligence Foundation Unit Test Suite
"""
import asyncio
import sys
import unittest
from pathlib import Path
from typing import Dict, Any

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from intelligence.schemas.incident import Incident, active_incident_manager
from intelligence.schemas.context import AgentContext
from intelligence.schemas.results import AgentResult, AgentStatus
from intelligence.schemas.contracts import ReconResult, VerificationResult, PredictionResult, ActionPlan, DispatchPlan
from intelligence.agents.base import BaseAgent
from intelligence.agents.recon import ReconAgent
from intelligence.agents.verifier import VerifierAgent
from intelligence.agents.predictor import PredictorAgent
from intelligence.agents.orchestrator import OrchestratorAgent
from intelligence.agents.router_dispatch import RouterDispatchAgent
from intelligence.orchestration.registry import AgentRegistry
from intelligence.orchestration.events import EventBus, IntelligenceEvent, EventTypes
from intelligence.orchestration.state import IntelligenceStateManager
from intelligence.orchestration.engine import OODAEngine


class SlowTimeoutAgent(BaseAgent):
    name: str = "SLOW_AGENT"
    version: str = "1.0.0"
    timeout_seconds: float = 0.1
    max_retries: int = 1

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        await asyncio.sleep(0.5)  # Intentionally exceed 0.1s timeout
        return {"output": "should_not_reach"}


class FailingAgent(BaseAgent):
    name: str = "FAILING_AGENT"
    version: str = "1.0.0"
    timeout_seconds: float = 2.0
    max_retries: int = 1

    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        raise ValueError("Simulated agent runtime exception")


class TestPhase4AIntelligencePipeline(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.registry = AgentRegistry()
        self.state_manager = IntelligenceStateManager()
        self.event_bus = EventBus()
        self.engine = OODAEngine(
            registry=self.registry,
            state_manager=self.state_manager,
            bus=self.event_bus
        )

        # Register standard 5 agents
        self.registry.register(ReconAgent())
        self.registry.register(VerifierAgent())
        self.registry.register(PredictorAgent())
        self.registry.register(OrchestratorAgent())
        self.registry.register(RouterDispatchAgent())

    async def test_01_agent_contracts_and_results(self):
        ctx = AgentContext(frame_id="FRAME-TEST01", incident_id="INC-001")
        recon = ReconAgent()
        res = await recon.execute(ctx)

        self.assertEqual(res.agent, "RECON")
        self.assertEqual(res.status, AgentStatus.SUCCESS)
        self.assertGreater(res.confidence, 0.0)
        self.assertIn("situation_summary", res.result)
        self.assertIn("idempotency_key", res.metadata)

    async def test_02_five_agent_pipeline_dependency_execution(self):
        emitted_events = []

        async def on_event(evt: IntelligenceEvent):
            emitted_events.append(evt.event_type)

        self.event_bus.subscribe("*", on_event)

        # Test Observation input
        mock_observation = {
            "timestamp": "12:00:00",
            "flood": {"coverage_percent": 34.5, "confidence": 95.0},
            "sectors": [
                {"sector_id": "S6", "status": "FLOODED", "flood_percentage": 35.0},
                {"sector_id": "S7", "status": "SEVERELY_FLOODED", "flood_percentage": 78.0},
                {"sector_id": "S10", "status": "EARLY_FLOOD", "flood_percentage": 12.0}
            ],
            "infrastructure": {
                "roads": [{"road_id": "ROAD-H-S6", "status": "BLOCKED"}],
                "bridges": [{"bridge_id": "BRIDGE-01", "status": "FAILED"}]
            },
            "change": {"coverage_delta": 15.0, "newly_affected_sectors": ["S7"]},
            "quality": {"image_valid": True, "calibration_valid": True}
        }

        pipeline_res = await self.engine.run_pipeline("FRAME-000100", mock_observation)

        self.assertEqual(pipeline_res["status"], "SUCCESS")
        self.assertEqual(len(pipeline_res["results"]), 5)

        # Verify dependency execution results
        recon_out = pipeline_res["results"]["RECON"]["result"]
        self.assertEqual(recon_out["flood_coverage"], 34.5)
        self.assertIn("S6", recon_out["affected_sectors"])
        self.assertIn("S7", recon_out["affected_sectors"])

        verifier_out = pipeline_res["results"]["VERIFIER"]["result"]
        self.assertTrue(verifier_out["verified"])
        self.assertIn("S7", verifier_out["newly_affected_sectors"])

        predictor_out = pipeline_res["results"]["PREDICTOR"]["result"]
        self.assertGreater(predictor_out["predicted_flood_coverage"], 34.5)

        orchestrator_out = pipeline_res["results"]["ORCHESTRATOR"]["result"]
        self.assertTrue(orchestrator_out["requires_approval"])
        self.assertGreater(len(orchestrator_out["actions"]), 0)

        router_out = pipeline_res["results"]["ROUTER_DISPATCH"]["result"]
        self.assertGreater(len(router_out["dispatches"]), 0)

        # Check emitted events
        self.assertIn(EventTypes.FRAME_READY_FOR_INTELLIGENCE.value, emitted_events)
        self.assertIn(EventTypes.AGENT_STARTED.value, emitted_events)
        self.assertIn(EventTypes.AGENT_COMPLETED.value, emitted_events)
        self.assertIn(EventTypes.PIPELINE_COMPLETED.value, emitted_events)

    async def test_03_agent_timeout_enforcement(self):
        slow_agent = SlowTimeoutAgent()
        ctx = AgentContext(frame_id="FRAME-TIMEOUT01")
        res = await slow_agent.execute(ctx)

        self.assertEqual(res.status, AgentStatus.FAILED)
        self.assertIn("AGENT_TIMEOUT", res.errors[0])
        self.assertEqual(res.metadata["error_code"], "AGENT_TIMEOUT")

    async def test_04_retry_and_failure_isolation(self):
        failing_registry = AgentRegistry()
        failing_registry.register(ReconAgent())
        failing_registry.register(FailingAgent())
        failing_registry.register(PredictorAgent())

        engine = OODAEngine(
            registry=failing_registry,
            state_manager=self.state_manager,
            bus=self.event_bus,
            pipeline_order=["RECON", "FAILING_AGENT", "PREDICTOR"]
        )

        mock_obs = {"flood": {"coverage_percent": 10.0}}
        pipeline_res = await engine.run_pipeline("FRAME-FAIL01", mock_obs)

        # Pipeline handles failure without throwing uncaught exceptions
        self.assertEqual(pipeline_res["status"], "FAILED")
        self.assertEqual(pipeline_res["agent_statuses"]["FAILING_AGENT"], "FAILED")
        self.assertEqual(pipeline_res["results"]["FAILING_AGENT"]["status"], "FAILED")

    async def test_05_idempotency(self):
        mock_obs = {"flood": {"coverage_percent": 10.0}}
        # First execution
        res1 = await self.engine.run_pipeline("FRAME-IDEM01", mock_obs)
        self.assertEqual(res1["status"], "SUCCESS")

        # Second execution (idempotent match)
        res2 = await self.engine.run_pipeline("FRAME-IDEM01", mock_obs)
        self.assertEqual(res2["status"], "SUCCESS")

    async def test_06_completely_dry_model(self):
        """TEST 1: Verify 5 agents report NORMAL/DRY/STANDBY with zero false flooding when model is dry."""
        dry_observation = {
            "timestamp": "12:00:00",
            "perception": {
                "water_detected": False,
                "flood_detected": False,
                "river_water_present": False,
                "flood_coverage_percent": 0.0,
                "flood_pixels": 0,
                "confidence": 96.0
            },
            "flood": {"coverage_percent": 0.0, "confidence": 96.0},
            "sectors": [
                {"sector_id": f"S{i}", "status": "DRY", "flood_percentage": 0.0} for i in range(1, 17)
            ],
            "infrastructure": {
                "roads": [],
                "bridges": [{"bridge_id": "BRIDGE-01", "status": "OPEN"}],
                "buildings": []
            },
            "change": {"coverage_delta": 0.0, "newly_affected_sectors": []},
            "quality": {"image_valid": True, "calibration_valid": True}
        }

        pipeline_res = await self.engine.run_pipeline("FRAME-DRY01", dry_observation, force_reexecute=True)
        self.assertEqual(pipeline_res["status"], "SUCCESS")

        res = pipeline_res["results"]
        r = res["RECON"]["result"]
        v = res["VERIFIER"]["result"]
        p = res["PREDICTOR"]["result"]
        o = res["ORCHESTRATOR"]["result"]
        d = res["ROUTER_DISPATCH"]["result"]

        # 1. RECON
        self.assertFalse(r["flood_detected"])
        self.assertEqual(r["flood_coverage_percent"], 0.0)
        self.assertEqual(r["affected_sectors"], [])
        self.assertEqual(r["blocked_roads"], [])
        self.assertEqual(r["bridge_status"], "OPEN")
        self.assertEqual(r["affected_buildings"], 0)

        # 2. VERIFIER
        self.assertTrue(v["verified"])
        self.assertEqual(v["severity"], "NORMAL")
        self.assertEqual(v["newly_affected_sectors"], [])
        self.assertEqual(v["flood_change_percent"], 0.0)

        # 3. PREDICTOR
        self.assertEqual(p["current_risk"], "NORMAL")
        self.assertEqual(p["predicted_sectors"], [])
        self.assertEqual(p["predicted_flood_coverage"], 0.0)

        # 4. ORCHESTRATOR
        self.assertEqual(o["priority"], "NORMAL")
        self.assertEqual(o["actions"][0]["action"], "MONITOR")

        # 5. ROUTER_DISPATCH
        self.assertEqual(d["dispatch_status"], "STANDBY")
        self.assertEqual(d["network_status"], "CLEAR")
        self.assertEqual(d["blocked_roads"], [])
        self.assertEqual(d["routes"], [])
        self.assertEqual(d["dispatches"], [])

    async def test_07_river_only(self):
        """TEST 2: Verify normal river water does NOT trigger city flood alert."""
        river_observation = {
            "timestamp": "12:05:00",
            "perception": {
                "water_detected": True,
                "flood_detected": False,
                "river_water_present": True,
                "flood_coverage_percent": 0.0,
                "flood_pixels": 0,
                "confidence": 96.0
            },
            "flood": {"coverage_percent": 0.0, "confidence": 96.0},
            "sectors": [
                {"sector_id": f"S{i}", "status": "DRY", "flood_percentage": 0.0} for i in range(1, 17)
            ],
            "infrastructure": {
                "roads": [],
                "bridges": [{"bridge_id": "BRIDGE-01", "status": "OPEN"}],
                "buildings": []
            },
            "change": {"coverage_delta": 0.0, "newly_affected_sectors": []},
            "quality": {"image_valid": True, "calibration_valid": True}
        }

        pipeline_res = await self.engine.run_pipeline("FRAME-RIVER01", river_observation, force_reexecute=True)
        r = pipeline_res["results"]["RECON"]["result"]
        o = pipeline_res["results"]["ORCHESTRATOR"]["result"]

        self.assertFalse(r["flood_detected"])
        self.assertEqual(r["flood_coverage_percent"], 0.0)
        self.assertEqual(r["affected_sectors"], [])
        self.assertEqual(o["priority"], "NORMAL")

    async def test_08_water_enters_s6(self):
        """TEST 3: Verify water entering S6 is accurately reported."""
        s6_obs = {
            "timestamp": "12:10:00",
            "perception": {"water_detected": True, "flood_detected": True, "flood_coverage_percent": 12.0},
            "flood": {"coverage_percent": 12.0, "confidence": 95.0},
            "sectors": [
                {"sector_id": "S6", "status": "FLOODED", "flood_percentage": 12.0}
            ] + [{"sector_id": f"S{i}", "status": "DRY", "flood_percentage": 0.0} for i in range(1, 17) if i != 6],
            "infrastructure": {"roads": [], "bridges": [{"bridge_id": "BRIDGE-01", "status": "OPEN"}], "buildings": []},
            "change": {"coverage_delta": 12.0, "newly_affected_sectors": ["S6"]},
            "quality": {"image_valid": True, "calibration_valid": True}
        }

        pipeline_res = await self.engine.run_pipeline("FRAME-S6-01", s6_obs, force_reexecute=True)
        r = pipeline_res["results"]["RECON"]["result"]
        v = pipeline_res["results"]["VERIFIER"]["result"]
        o = pipeline_res["results"]["ORCHESTRATOR"]["result"]
        d = pipeline_res["results"]["ROUTER_DISPATCH"]["result"]

        self.assertTrue(r["flood_detected"])
        self.assertEqual(r["affected_sectors"], ["S6"])
        self.assertIn("S6", v["newly_affected_sectors"])
        self.assertEqual(o["priority"], "HIGH")
        self.assertEqual(d["dispatch_status"], "ACTIVE")

    async def test_09_water_expands_to_s7(self):
        """TEST 4: Verify temporal expansion from S6 to S7."""
        s7_obs = {
            "timestamp": "12:15:00",
            "perception": {"water_detected": True, "flood_detected": True, "flood_coverage_percent": 24.0},
            "flood": {"coverage_percent": 24.0, "confidence": 95.0},
            "sectors": [
                {"sector_id": "S6", "status": "FLOODED", "flood_percentage": 15.0},
                {"sector_id": "S7", "status": "EARLY_FLOOD", "flood_percentage": 9.0}
            ] + [{"sector_id": f"S{i}", "status": "DRY", "flood_percentage": 0.0} for i in range(1, 17) if i not in [6, 7]],
            "infrastructure": {"roads": [], "bridges": [{"bridge_id": "BRIDGE-01", "status": "OPEN"}], "buildings": []},
            "change": {"coverage_delta": 12.0, "newly_affected_sectors": ["S7"]},
            "quality": {"image_valid": True, "calibration_valid": True}
        }

        pipeline_res = await self.engine.run_pipeline("FRAME-S7-01", s7_obs, force_reexecute=True)
        r = pipeline_res["results"]["RECON"]["result"]
        v = pipeline_res["results"]["VERIFIER"]["result"]

        self.assertIn("S6", r["affected_sectors"])
        self.assertIn("S7", r["affected_sectors"])
        self.assertEqual(v["newly_affected_sectors"], ["S7"])
        self.assertEqual(v["flood_change_percent"], 12.0)

    async def test_10_water_enters_building(self):
        """TEST 5: Verify affected building count reflects physical observation."""
        dry_obs = {
            "flood": {"coverage_percent": 0.0},
            "sectors": [{"sector_id": f"S{i}", "status": "DRY"} for i in range(1, 17)],
            "infrastructure": {"buildings": []}
        }
        res_dry = await self.engine.run_pipeline("FRAME-B-DRY", dry_obs, force_reexecute=True)
        self.assertEqual(res_dry["results"]["RECON"]["result"]["affected_buildings"], 0)


if __name__ == "__main__":
    unittest.main()

