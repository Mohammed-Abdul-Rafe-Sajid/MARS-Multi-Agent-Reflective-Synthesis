"""
LLM client — OpenAI SDK wrapper with retry logic.
All agents call call_llm(); never instantiate the SDK directly in agent code.
Model: gpt-4o (configurable via LLM_MODEL in .env)
"""

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from loguru import logger
from config import settings

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10), reraise=True)
def call_llm(system_prompt: str, user_message: str, max_tokens: int | None = None) -> str:
    """
    Call OpenAI chat completion with a system prompt and user message.
    Returns the assistant's text response.
    """
    client = get_client()
    tok = max_tokens or settings.llm_max_tokens
    logger.debug(f"LLM call | model={settings.llm_model} | max_tokens={tok}")

    response = client.chat.completions.create(
        model=settings.llm_model,
        max_tokens=tok,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        temperature=0.2,   # low temperature for deterministic, structured outputs
    )

    return response.choices[0].message.content.strip()
