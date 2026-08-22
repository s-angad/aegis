"""
Agent 8: Command Orchestrator
Runs the full OODA loop: SIMULATE → OBSERVE → ANALYZE → VERIFY → PREDICT → DECIDE → ACT → UPDATE SIMULATION.
Coordinates all specialist agents, including CV Recon telemetry, Drone Recon, and Policy Commander, each simulation tick.
"""
from typing import List, Dict, Any, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine

from ..models.incident import Incident
from ..models.agent import AgentDecision, AgentName, Alert
from ..models.prediction import Prediction
from .sentinel import SentinelAgent
from .verifier import VerificationAgent
from .severity import SeverityAgent
from .predictor import PredictionAgent
from .allocator import AllocationAgent
from .router import RoutingAgent
from .communicator import CommunicationAgent
from .drone_recon import DroneReconAgent
from .policy_commander import PolicyCommanderAgent
from ..recon.service import recon_service


class CommandOrchestrator:
    """
    Master orchestrator implementing the Closed-Loop OODA loop.
    Runs the full agent pipeline each simulation tick.
    """

    def __init__(self):
        self.sentinel = SentinelAgent()
        self.verifier = VerificationAgent()
        self.severity = SeverityAgent()
        self.predictor = PredictionAgent()
        self.allocator = AllocationAgent()
        self.router = RoutingAgent()
        self.communicator = CommunicationAgent()
        
        self.drone_recon = DroneReconAgent()
        self.policy_commander = PolicyCommanderAgent()

        self.all_verified_incidents: List[Incident] = []
        self.all_decisions: List[AgentDecision] = []
        self.all_alerts: List[Alert] = []
        self.current_prediction: Prediction = Prediction()
        self.current_routes: Dict[str, List] = {}

        self._broadcast_cb = None

    def set_broadcast_callback(self, cb):
        self._broadcast_cb = cb

    async def run_pipeline(self, engine: "SimulationEngine"):
        """Execute full Closed-Loop OODA cycle for one tick."""
        tick_decisions: List[AgentDecision] = []
        tick_alerts: List[Alert] = []

        # Get latest CV Recon observation if available
        latest_recon = recon_service.get_latest_observation()

        # --- OBSERVE: Drone Recon sweeps ---
        scans, drone_decisions = self.drone_recon.process(engine)
        tick_decisions.extend(drone_decisions)

        # --- OBSERVE: Sentinel ingests raw reports ---
        new_incidents, sentinel_decisions = self.sentinel.process(engine)
        tick_decisions.extend(sentinel_decisions)

        # --- ORIENT / VERIFY: Sensor Fusion with CV Recon ---
        verified, verify_decisions = self.verifier.process(
            new_incidents, self.all_verified_incidents, engine, recon_obs=latest_recon
        )
        tick_decisions.extend(verify_decisions)

        # Merge verified into active list
        existing_ids = {i.id for i in self.all_verified_incidents}
        for inc in verified:
            if inc.id not in existing_ids:
                self.all_verified_incidents.append(inc)

        # Keep only active incidents
        active = [i for i in self.all_verified_incidents if i.is_active]

        # --- ORIENT: Severity scoring with visual velocity ---
        active, severity_decisions = self.severity.process(active, engine, recon_obs=latest_recon)
        tick_decisions.extend(severity_decisions)

        # --- ORIENT: Prediction & Forecasts ---
        prediction, predict_decisions = self.predictor.process(engine, recon_obs=latest_recon)
        self.current_prediction = prediction
        tick_decisions.extend(predict_decisions)

        # --- DECIDE: Policy Commander directives ---
        recs, policy_decisions = self.policy_commander.process(active, engine, recon_obs=latest_recon)
        tick_decisions.extend(policy_decisions)

        # --- DECIDE: Resource Allocation ---
        active, alloc_decisions = self.allocator.process(active, engine)
        tick_decisions.extend(alloc_decisions)

        # --- ACT: Dynamic Routing (NetworkX A*) ---
        routes, route_decisions = self.router.process(active, engine)
        self.current_routes = routes
        tick_decisions.extend(route_decisions)

        # --- ACT: Communications ---
        alerts, comm_decisions = self.communicator.process(active, prediction, engine)
        tick_decisions.extend(comm_decisions)
        tick_alerts.extend(alerts)

        # Orchestrator meta-decision
        recon_status_str = f"CV Frame #{latest_recon.frame_number} ({latest_recon.flood_area_percent:.1f}% flooded)" if latest_recon else "No visual frame ingested yet"
        
        tick_decisions.append(AgentDecision(
            agent_name=AgentName.ORCHESTRATOR,
            action=f"Closed-Loop Cycle Complete — Tick {engine.tick}",
            description=(
                f"Pipeline: {len(new_incidents)} raw → {len(verified)} verified → "
                f"{sum(1 for i in active if i.severity.value in ('HIGH', 'CRITICAL'))} priority → "
                f"{len(alerts)} comms"
            ),
            reasoning=(
                f"Full Closed-Loop OODA cycle executed in Tick {engine.tick}. "
                f"Recon Telemetry: {recon_status_str}. "
                f"Sentinel: {len(new_incidents)} events. Verified: {len(verified)}. "
                f"Active incidents: {len(active)}. "
                f"Resources en route: {sum(1 for r in engine.resources if r.status.value == 'en_route')}. "
                f"Alerts generated: {len(alerts)}."
            ),
            sop_reference=None,
            severity="info",
        ))

        # Store all decisions and alerts
        self.all_decisions.extend(tick_decisions)
        self.all_alerts.extend(tick_alerts)

        # Broadcast each decision and alert
        if self._broadcast_cb:
            for scan in scans:
                await self._broadcast_cb("drone_telemetry", scan)

            await self._broadcast_cb("policy_recommendations", {
                "tick": engine.tick,
                "recommendations": recs
            })

            for decision in tick_decisions:
                await self._broadcast_cb("agent_decision", decision.model_dump(mode="json"))

            for alert in tick_alerts:
                await self._broadcast_cb("alert", alert.model_dump(mode="json"))

            await self._broadcast_cb("incidents_update", {
                "incidents": [i.model_dump(mode="json") for i in active],
                "tick": engine.tick,
            })

            await self._broadcast_cb("prediction_update", {
                "prediction": prediction.model_dump(mode="json"),
                "tick": engine.tick,
            })

            await self._broadcast_cb("routes_update", {
                "routes": routes,
                "tick": engine.tick,
            })

    def get_full_state(self) -> Dict[str, Any]:
        return {
            "incidents": [i.model_dump(mode="json") for i in self.all_verified_incidents],
            "prediction": self.current_prediction.model_dump(mode="json"),
            "routes": self.current_routes,
            "recent_decisions": [d.model_dump(mode="json") for d in self.all_decisions[-25:]],
            "alerts": [a.model_dump(mode="json") for a in self.all_alerts[-15:]],
        }
