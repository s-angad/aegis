"""
AEGIS FLOOD v2.0 - OpenAI Agent Service (Phase 4B GPT-5.6 Luna Integration)
Handles async API calls to OpenAI GPT-5.6 Luna with structured outputs, timeout protection,
retry handling, error categorization, token logging, and backend API key security.
"""
import asyncio
import json
import logging
import os
import time
from typing import Dict, Any, Tuple, Optional, Type, TypeVar
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("aegis-openai-service")

T = TypeVar("T", bound=BaseModel)

# Import official OpenAI SDK lazily to allow running without crashing if not installed
try:
    import openai
    from openai import AsyncOpenAI, APIError, AuthenticationError, RateLimitError, APITimeoutError
    HAS_OPENAI_SDK = True
except ImportError:
    HAS_OPENAI_SDK = False
    AsyncOpenAI = None


class OpenAIAgentService:
    """
    Unified client service for executing GPT-5.6 Luna AI Agents.
    Backend only - NEVER exposes API keys to client/frontend.
    """

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model = os.getenv("OPENAI_AGENT_MODEL", "gpt-5.6-luna").strip()
        self.reasoning_effort = os.getenv("OPENAI_AGENT_REASONING_EFFORT", "medium").strip()
        self.agent_mode = os.getenv("AGENT_MODE", "REAL").strip().upper()
        self.timeout_seconds = float(os.getenv("OPENAI_AGENT_TIMEOUT_SECONDS", "30"))
        self.max_retries = int(os.getenv("OPENAI_AGENT_MAX_RETRIES", "2"))

        self._client: Optional[Any] = None
        if HAS_OPENAI_SDK and self.is_key_valid():
            self._client = AsyncOpenAI(api_key=self.api_key)

    def is_key_valid(self) -> bool:
        """Checks if API key is populated and not placeholder."""
        if not self.api_key:
            return False
        if "your_" in self.api_key.lower() or "key_here" in self.api_key.lower():
            return False
        return True

    def is_available(self) -> bool:
        """Returns True if OpenAI SDK is installed, valid API key present, and AGENT_MODE is REAL."""
        return HAS_OPENAI_SDK and self.is_key_valid() and (self.agent_mode == "REAL")

    def refresh_config(self):
        """Reloads env config dynamically."""
        load_dotenv(override=True)
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model = os.getenv("OPENAI_AGENT_MODEL", "gpt-5.6-luna").strip()
        self.reasoning_effort = os.getenv("OPENAI_AGENT_REASONING_EFFORT", "medium").strip()
        self.agent_mode = os.getenv("AGENT_MODE", "REAL").strip().upper()
        if HAS_OPENAI_SDK and self.is_key_valid():
            self._client = AsyncOpenAI(api_key=self.api_key)

    async def call_agent(
        self,
        agent_name: str,
        system_prompt: str,
        user_payload: Dict[str, Any],
        response_schema: Type[T],
        frame_id: str = "",
        observation_id: str = ""
    ) -> Tuple[Optional[T], Dict[str, Any]]:
        """
        Executes structured output completion using GPT-5.6 Luna.
        Returns tuple of (parsed_pydantic_output, metadata_dict).
        """
        start_time = time.time()
        self.refresh_config()

        if not self.is_available():
            err_code = "AI_PROVIDER_UNAVAILABLE" if HAS_OPENAI_SDK else "SDK_NOT_INSTALLED"
            if self.agent_mode == "SIMULATION":
                err_code = "SIMULATION_MODE_ACTIVE"
            elif not self.is_key_valid():
                err_code = "AI_AUTH_ERROR"

            return None, {
                "success": False,
                "error_code": err_code,
                "message": f"OpenAI API unavailable ({err_code})",
                "model": self.model,
                "mode": self.agent_mode
            }

        prompt_json = json.dumps(user_payload, indent=2)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"FRAME: {frame_id}\nOBSERVATION_ID: {observation_id}\nINPUT_DATA:\n{prompt_json}"}
        ]

        attempt = 0
        last_error = ""

        while attempt <= self.max_retries:
            attempt += 1
            try:
                logger.info(f"[AI] [{frame_id}] {agent_name} -> {self.model} (Attempt {attempt})")
                
                # Attempt structured parse call using official OpenAI SDK
                try:
                    completion = await asyncio.wait_for(
                        self._client.beta.chat.completions.parse(
                            model=self.model,
                            messages=messages,
                            response_format=response_schema,
                            timeout=self.timeout_seconds
                        ),
                        timeout=self.timeout_seconds
                    )
                    parsed_obj = completion.choices[0].message.parsed
                    tokens_used = completion.usage.total_tokens if completion.usage else 0
                except (AttributeError, Exception) as parse_err:
                    # Fallback to json_object mode if beta.parse is unavailable in model/SDK version
                    logger.debug(f"[AI] Structured parse fallback to json_object: {parse_err}")
                    completion = await asyncio.wait_for(
                        self._client.chat.completions.create(
                            model=self.model,
                            messages=messages,
                            response_format={"type": "json_object"},
                            timeout=self.timeout_seconds
                        ),
                        timeout=self.timeout_seconds
                    )
                    content_str = completion.choices[0].message.content or "{}"
                    parsed_obj = response_schema.model_validate_json(content_str)
                    tokens_used = completion.usage.total_tokens if completion.usage else 0

                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                
                # Stamp source fields into output
                if hasattr(parsed_obj, "source_frame"):
                    setattr(parsed_obj, "source_frame", frame_id)
                if hasattr(parsed_obj, "source_observation_id"):
                    setattr(parsed_obj, "source_observation_id", observation_id)
                if hasattr(parsed_obj, "model"):
                    setattr(parsed_obj, "model", self.model)

                logger.info(f"[AI] [{frame_id}] {agent_name} -> {self.model} SUCCESS in {elapsed_ms}ms | Tokens: {tokens_used}")

                return parsed_obj, {
                    "success": True,
                    "error_code": None,
                    "latency_ms": elapsed_ms,
                    "tokens_used": tokens_used,
                    "model": self.model,
                    "attempts": attempt
                }

            except AuthenticationError as e:
                logger.error(f"[AI] OpenAI Authentication Error: {e}")
                return None, {"success": False, "error_code": "AI_AUTH_ERROR", "message": str(e), "model": self.model}
            except RateLimitError as e:
                logger.warning(f"[AI] OpenAI Rate Limit Error (attempt {attempt}): {e}")
                last_error = f"AI_RATE_LIMITED: {e}"
                await asyncio.sleep(1.0 * attempt)
            except APITimeoutError as e:
                logger.warning(f"[AI] OpenAI Timeout Error (attempt {attempt}): {e}")
                last_error = f"AGENT_TIMEOUT: {e}"
                await asyncio.sleep(0.5 * attempt)
            except APIError as e:
                logger.warning(f"[AI] OpenAI API Error (attempt {attempt}): {e}")
                last_error = f"AI_PROVIDER_UNAVAILABLE: {e}"
                await asyncio.sleep(0.5 * attempt)
            except Exception as e:
                logger.warning(f"[AI] OpenAI Parsing/Output Error (attempt {attempt}): {e}")
                last_error = f"AGENT_OUTPUT_INVALID: {e}"
                await asyncio.sleep(0.5 * attempt)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        err_code = "AGENT_OUTPUT_INVALID" if "INVALID" in last_error else ("AI_RATE_LIMITED" if "RATE" in last_error else "AI_PROVIDER_UNAVAILABLE")
        logger.error(f"[AI] [{frame_id}] {agent_name} -> {self.model} FAILED after {attempt} attempts: {last_error}")

        return None, {
            "success": False,
            "error_code": err_code,
            "message": last_error,
            "latency_ms": elapsed_ms,
            "model": self.model,
            "attempts": attempt
        }


# Singleton service instance
openai_agent_service = OpenAIAgentService()
