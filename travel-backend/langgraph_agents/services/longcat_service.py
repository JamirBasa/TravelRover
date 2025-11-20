"""
LongCat API Service
Provides integration with LongCat.chat API for chat completions
Supports both regular chat and thinking modes

Free Tier: 500K tokens/day per account
Models:
- LongCat-Flash-Chat: Fast general-purpose chat
- LongCat-Flash-Thinking: Deep reasoning with thinking process
"""

import os
import logging
import requests
from typing import List, Dict, Optional, Generator
from django.conf import settings

logger = logging.getLogger(__name__)


class LongCatService:
    """
    Service for interacting with LongCat API
    OpenAI-compatible format for easy integration
    """

    BASE_URL = "https://api.longcat.chat/openai/v1"
    CHAT_MODEL = "LongCat-Flash-Chat"
    THINKING_MODEL = "LongCat-Flash-Thinking"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize LongCat service
        
        Args:
            api_key: LongCat API key (defaults to settings.LONGCAT_API_KEY)
        """
        self.api_key = api_key or getattr(settings, "LONGCAT_API_KEY", None)
        if not self.api_key:
            logger.warning("LongCat API key not configured")

    def is_configured(self) -> bool:
        """Check if LongCat API key is configured"""
        return bool(self.api_key)

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = CHAT_MODEL,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False,
        enable_thinking: bool = False,
        thinking_budget: int = 1024,
    ) -> Dict:
        """
        Create a chat completion using LongCat API
        
        Args:
            messages: List of message objects with 'role' and 'content'
            model: Model to use (CHAT_MODEL or THINKING_MODEL)
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            enable_thinking: Enable thinking mode (only for THINKING_MODEL)
            thinking_budget: Max thinking tokens (only for THINKING_MODEL)
            
        Returns:
            Response dict with 'choices', 'usage', etc.
        """
        if not self.is_configured():
            raise ValueError("LongCat API key not configured")

        url = f"{self.BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }

        # Add thinking parameters if using thinking model
        if model == self.THINKING_MODEL and enable_thinking:
            payload["enable_thinking"] = True
            payload["thinking_budget"] = max(thinking_budget, 1024)
            # Ensure max_tokens > thinking_budget
            if payload["max_tokens"] <= payload["thinking_budget"]:
                payload["max_tokens"] = payload["thinking_budget"] + 1024

        try:
            logger.info(f"LongCat API request: model={model}, thinking={enable_thinking}")
            
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=60,  # 60s timeout for thinking mode
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"LongCat API success: {result.get('usage', {})}")
            return result

        except requests.exceptions.RequestException as e:
            logger.error(f"LongCat API error: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            raise

    def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = CHAT_MODEL,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        enable_thinking: bool = False,
        thinking_budget: int = 1024,
    ) -> Generator[str, None, None]:
        """
        Stream chat completion from LongCat API
        
        Args:
            Same as chat_completion
            
        Yields:
            SSE data strings
        """
        if not self.is_configured():
            raise ValueError("LongCat API key not configured")

        url = f"{self.BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        if model == self.THINKING_MODEL and enable_thinking:
            payload["enable_thinking"] = True
            payload["thinking_budget"] = max(thinking_budget, 1024)
            if payload["max_tokens"] <= payload["thinking_budget"]:
                payload["max_tokens"] = payload["thinking_budget"] + 1024

        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                stream=True,
                timeout=60,
            )
            response.raise_for_status()

            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith('data: '):
                        data = decoded_line[6:]  # Remove 'data: ' prefix
                        if data.strip() != '[DONE]':
                            yield data

        except requests.exceptions.RequestException as e:
            logger.error(f"LongCat streaming error: {str(e)}")
            raise

    def check_health(self) -> Dict:
        """
        Check LongCat API health and configuration
        
        Returns:
            Dict with status information
        """
        if not self.api_key:
            return {
                "configured": False,
                "valid": False,
                "message": "API key not configured"
            }

        try:
            # Test with a simple request
            result = self.chat_completion(
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=10,
            )
            
            return {
                "configured": True,
                "valid": True,
                "model": result.get("model"),
                "message": "LongCat API operational"
            }

        except Exception as e:
            return {
                "configured": True,
                "valid": False,
                "error": str(e),
                "message": "LongCat API error"
            }
