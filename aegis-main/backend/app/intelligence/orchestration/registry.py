"""
AEGIS FLOOD v2.0 - Agent Registry (Phase 4A)
Central registry for specialized intelligence agents.
"""
from typing import Dict, List, Optional
import logging

from ..agents.base import BaseAgent
from ..agents.recon import ReconAgent
from ..agents.verifier import VerifierAgent
from ..agents.predictor import PredictorAgent
from ..agents.orchestrator import OrchestratorAgent
from ..agents.router_dispatch import RouterDispatchAgent

logger = logging.getLogger("aegis-agent-registry")


class AgentRegistry:
    """
    Central registry for managing registered BaseAgent instances.
    Enforces single point of agent instantiation and retrieval.
    """

    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}

    def register(self, agent: BaseAgent):
        """Registers a BaseAgent instance by its unique name."""
        if not isinstance(agent, BaseAgent):
            raise TypeError(f"Cannot register object of type {type(agent)}, must inherit from BaseAgent")
        self._agents[agent.name] = agent
        logger.info(f"Registered agent: {agent.name} (v{agent.version})")

    def get(self, name: str) -> Optional[BaseAgent]:
        """Retrieves a registered agent instance by name."""
        return self._agents.get(name)

    def list_agents(self) -> List[str]:
        """Returns list of registered agent names in registration order."""
        return list(self._agents.keys())

    def clear(self):
        """Clears all registered agents (used for testing)."""
        self._agents.clear()


# Default global AgentRegistry instance with the 5 baseline agents registered
agent_registry = AgentRegistry()
agent_registry.register(ReconAgent())
agent_registry.register(VerifierAgent())
agent_registry.register(PredictorAgent())
agent_registry.register(OrchestratorAgent())
agent_registry.register(RouterDispatchAgent())
