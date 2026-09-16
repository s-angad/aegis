"""
AEGIS FLOOD v2.0 - Base Agent Abstract Interface (Phase 4A)
"""
from abc import ABC, abstractmethod
import asyncio
import logging
import time
from typing import Dict, Any, List, Optional

from ..schemas.context import AgentContext
from ..schemas.results import AgentResult, AgentStatus

logger = logging.getLogger("aegis-intelligence-agent")


class BaseAgent(ABC):
    """
    Common abstract interface for all specialized intelligence agents in AEGIS FLOOD v2.0.
    Handles execution timing, timeout enforcement, controlled retries, error catching,
    and structured AgentResult wrapping.
    """

    name: str = "BASE_AGENT"
    version: str = "1.0.0"
    timeout_seconds: float = 5.0
    max_retries: int = 2

    async def execute(self, context: AgentContext) -> AgentResult:
        """
        Executes the agent with timeout protection, retries, and timing measurement.
        Returns a standardized AgentResult object.
        """
        start_time = time.time()
        attempt = 0
        last_exception: Optional[Exception] = None
        warnings: List[str] = []
        errors: List[str] = []

        logger.info(f"[{self.name}] Starting agent execution for frame {context.frame_id}")

        while attempt <= self.max_retries:
            attempt += 1
            try:
                # Enforce agent timeout limit using asyncio.wait_for
                raw_output = await asyncio.wait_for(
                    self._run(context),
                    timeout=self.timeout_seconds
                )
                elapsed_ms = round((time.time() - start_time) * 1000, 2)

                confidence = raw_output.pop("_confidence", 0.95)
                agent_warnings = raw_output.pop("_warnings", [])
                warnings.extend(agent_warnings)

                logger.info(f"[{self.name}] Completed in {elapsed_ms}ms (Confidence: {confidence})")

                return AgentResult(
                    agent=self.name,
                    agent_version=self.version,
                    frame_id=context.frame_id,
                    incident_id=context.incident_id,
                    status=AgentStatus.SUCCESS,
                    confidence=float(confidence),
                    execution_time_ms=elapsed_ms,
                    result=raw_output,
                    warnings=warnings,
                    errors=[],
                    metadata={
                        "attempt": attempt,
                        "timeout_seconds": self.timeout_seconds,
                        "idempotency_key": f"{context.incident_id}:{context.frame_id}:{self.name}"
                    }
                )

            except asyncio.TimeoutError:
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                err_msg = f"AGENT_TIMEOUT: {self.name} exceeded timeout limit of {self.timeout_seconds}s"
                logger.error(f"[{self.name}] {err_msg}")
                return AgentResult(
                    agent=self.name,
                    agent_version=self.version,
                    frame_id=context.frame_id,
                    incident_id=context.incident_id,
                    status=AgentStatus.FAILED,
                    confidence=0.0,
                    execution_time_ms=elapsed_ms,
                    result={},
                    warnings=warnings,
                    errors=[err_msg],
                    metadata={
                        "attempt": attempt,
                        "error_code": "AGENT_TIMEOUT",
                        "idempotency_key": f"{context.incident_id}:{context.frame_id}:{self.name}"
                    }
                )

            except Exception as e:
                last_exception = e
                logger.warning(f"[{self.name}] Execution attempt {attempt} failed: {e}")
                if attempt <= self.max_retries:
                    await asyncio.sleep(0.05 * attempt)  # Brief backoff before retry

        # If all retry attempts failed
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        err_msg = f"AGENT_EXECUTION_FAILED: {self.name} failed after {attempt} attempts: {last_exception}"
        logger.error(f"[{self.name}] {err_msg}")

        return AgentResult(
            agent=self.name,
            agent_version=self.version,
            frame_id=context.frame_id,
            incident_id=context.incident_id,
            status=AgentStatus.FAILED,
            confidence=0.0,
            execution_time_ms=elapsed_ms,
            result={},
            warnings=warnings,
            errors=[err_msg],
            metadata={
                "attempts_made": attempt,
                "error_code": "MAX_RETRIES_EXCEEDED",
                "idempotency_key": f"{context.incident_id}:{context.frame_id}:{self.name}"
            }
        )

    @abstractmethod
    async def _run(self, context: AgentContext) -> Dict[str, Any]:
        """
        Internal implementation of agent logic. Must be overridden by subclasses.
        Returns a dictionary representing the agent payload.
        """
        pass
