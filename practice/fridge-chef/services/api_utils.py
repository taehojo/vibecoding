"""API utilities for robust API calls with retry logic and caching.

Performance optimizations:
- Exponential backoff retry logic
- Request session reuse for connection pooling
- Response validation helpers
"""
import time
from functools import wraps
from typing import Callable, TypeVar, Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

T = TypeVar('T')


class APIError(Exception):
    """Custom exception for API errors."""
    def __init__(self, message: str, status_code: int | None = None, response: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


# Shared session with connection pooling and retry logic
_session: requests.Session | None = None


def get_api_session() -> requests.Session:
    """Get or create a shared requests session with retry logic.

    Features:
    - Connection pooling (reuses connections)
    - Automatic retries with exponential backoff
    - Timeout configuration
    """
    global _session
    if _session is None:
        _session = requests.Session()

        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,  # 1s, 2s, 4s between retries
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST"],
            raise_on_status=False,  # We handle status codes manually
        )

        # Mount adapter with retry strategy
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=10,
            pool_maxsize=10,
        )
        _session.mount("http://", adapter)
        _session.mount("https://", adapter)

    return _session


def close_api_session():
    """Close the shared API session."""
    global _session
    if _session is not None:
        _session.close()
        _session = None


def validate_openrouter_response(result: dict) -> str:
    """Validate OpenRouter API response and extract content.

    Args:
        result: Parsed JSON response from API.

    Returns:
        Content string from the response.

    Raises:
        APIError: If response format is invalid.
    """
    # Check for API errors in response
    if "error" in result:
        error = result["error"]
        message = error.get("message", "Unknown API error")
        code = error.get("code", "unknown")
        raise APIError(f"API error ({code}): {message}", response=result)

    # Validate choices array
    choices = result.get("choices")
    if not choices or not isinstance(choices, list) or len(choices) == 0:
        raise APIError("Invalid API response: missing 'choices' array", response=result)

    # Validate message object
    message = choices[0].get("message")
    if not message or not isinstance(message, dict):
        raise APIError("Invalid API response: missing 'message' object", response=result)

    # Validate content
    content = message.get("content", "")
    if not content:
        # Check for refusal
        if message.get("refusal"):
            raise APIError(f"Request refused: {message.get('refusal')}", response=result)
        raise APIError("Invalid API response: empty 'content'", response=result)

    return content


def retry_with_backoff(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (requests.RequestException, APIError),
) -> Callable:
    """Decorator for retry with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts.
        initial_delay: Initial delay between retries in seconds.
        backoff_factor: Multiplier for delay between retries.
        exceptions: Tuple of exception types to catch and retry.

    Returns:
        Decorated function.
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            delay = initial_delay
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    # Don't retry on final attempt
                    if attempt == max_retries:
                        break

                    # Don't retry on client errors (4xx except 429)
                    if isinstance(e, requests.HTTPError):
                        status_code = e.response.status_code if e.response else 0
                        if 400 <= status_code < 500 and status_code != 429:
                            raise

                    # Wait before retry
                    time.sleep(delay)
                    delay *= backoff_factor

            # Re-raise the last exception
            raise last_exception  # type: ignore

        return wrapper
    return decorator


def make_api_request(
    url: str,
    headers: dict,
    payload: dict,
    timeout: int = 60,
) -> dict:
    """Make an API request with proper error handling.

    Args:
        url: API endpoint URL.
        headers: Request headers.
        payload: Request body (JSON).
        timeout: Request timeout in seconds.

    Returns:
        Parsed JSON response.

    Raises:
        APIError: If request fails or response is invalid.
        requests.RequestException: For network errors.
    """
    session = get_api_session()

    response = session.post(
        url,
        headers=headers,
        json=payload,
        timeout=timeout,
    )

    # Handle HTTP errors
    if response.status_code >= 400:
        try:
            error_data = response.json()
            error_msg = error_data.get("error", {}).get("message", response.text)
        except Exception:
            error_msg = response.text

        raise APIError(
            f"API request failed: {error_msg}",
            status_code=response.status_code,
        )

    return response.json()
