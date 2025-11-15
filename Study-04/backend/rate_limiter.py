"""
Advanced rate limiting and request throttling module
"""
import time
import threading
from collections import defaultdict, deque
from typing import Dict, Optional, Tuple
import hashlib
import logging

logger = logging.getLogger(__name__)

class TokenBucketRateLimiter:
    """Token bucket algorithm for smooth rate limiting"""

    def __init__(self, capacity: int, refill_rate: float):
        """
        Initialize token bucket

        Args:
            capacity: Maximum number of tokens in bucket
            refill_rate: Tokens refilled per second
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()
        self._lock = threading.Lock()

    def consume(self, tokens: int = 1) -> Tuple[bool, float]:
        """
        Try to consume tokens

        Args:
            tokens: Number of tokens to consume

        Returns:
            Tuple of (success, wait_time_if_failed)
        """
        with self._lock:
            # Refill tokens based on elapsed time
            current_time = time.time()
            elapsed = current_time - self.last_refill
            tokens_to_add = elapsed * self.refill_rate

            self.tokens = min(self.capacity, self.tokens + tokens_to_add)
            self.last_refill = current_time

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True, 0.0
            else:
                # Calculate wait time
                tokens_needed = tokens - self.tokens
                wait_time = tokens_needed / self.refill_rate
                return False, wait_time


class SlidingWindowRateLimiter:
    """Sliding window rate limiter for precise request counting"""

    def __init__(self, max_requests: int, window_seconds: int):
        """
        Initialize sliding window limiter

        Args:
            max_requests: Maximum requests in window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = deque()
        self._lock = threading.Lock()

    def is_allowed(self) -> Tuple[bool, float]:
        """
        Check if request is allowed

        Returns:
            Tuple of (allowed, wait_time_if_not)
        """
        with self._lock:
            current_time = time.time()

            # Remove old requests outside window
            while self.requests and self.requests[0] < current_time - self.window_seconds:
                self.requests.popleft()

            if len(self.requests) < self.max_requests:
                self.requests.append(current_time)
                return True, 0.0
            else:
                # Calculate wait time until oldest request expires
                wait_time = self.window_seconds - (current_time - self.requests[0])
                return False, wait_time


class AdaptiveRateLimiter:
    """Adaptive rate limiter that adjusts based on system load"""

    def __init__(self, base_rate: int = 10, window_seconds: int = 60):
        """
        Initialize adaptive rate limiter

        Args:
            base_rate: Base request rate
            window_seconds: Time window
        """
        self.base_rate = base_rate
        self.window_seconds = window_seconds
        self.current_rate = base_rate

        # Track system metrics
        self.response_times = deque(maxlen=100)
        self.error_count = 0
        self.success_count = 0

        # Sliding window limiter
        self.limiter = SlidingWindowRateLimiter(self.current_rate, window_seconds)

        # Thread safety
        self._lock = threading.Lock()

        # Adjustment parameters
        self.min_rate = max(1, base_rate // 10)
        self.max_rate = base_rate * 3

        # Start adjustment thread
        self._stop_adjustment = threading.Event()
        self._adjustment_thread = threading.Thread(target=self._adjust_rate_worker)
        self._adjustment_thread.daemon = True
        self._adjustment_thread.start()

    def _adjust_rate_worker(self):
        """Background worker to adjust rate based on metrics"""
        while not self._stop_adjustment.is_set():
            try:
                self._adjust_rate()
                self._stop_adjustment.wait(10)  # Adjust every 10 seconds
            except Exception as e:
                logger.error(f"Rate adjustment error: {e}")

    def _adjust_rate(self):
        """Adjust rate based on system metrics"""
        with self._lock:
            if not self.response_times:
                return

            # Calculate metrics
            avg_response_time = sum(self.response_times) / len(self.response_times)
            error_rate = self.error_count / max(1, self.error_count + self.success_count)

            # Reset counters
            self.error_count = 0
            self.success_count = 0

            # Adjust rate based on metrics
            if error_rate > 0.1:  # More than 10% errors
                # Decrease rate
                self.current_rate = max(self.min_rate, int(self.current_rate * 0.8))
                logger.info(f"Decreased rate limit to {self.current_rate} due to high error rate")

            elif avg_response_time > 2.0:  # Response time > 2 seconds
                # Decrease rate
                self.current_rate = max(self.min_rate, int(self.current_rate * 0.9))
                logger.info(f"Decreased rate limit to {self.current_rate} due to slow responses")

            elif error_rate < 0.01 and avg_response_time < 0.5:  # Good performance
                # Increase rate
                self.current_rate = min(self.max_rate, int(self.current_rate * 1.1))
                logger.info(f"Increased rate limit to {self.current_rate} due to good performance")

            # Update limiter
            self.limiter = SlidingWindowRateLimiter(self.current_rate, self.window_seconds)

    def is_allowed(self) -> Tuple[bool, float]:
        """Check if request is allowed"""
        return self.limiter.is_allowed()

    def record_response(self, response_time: float, success: bool = True):
        """Record response metrics for adaptation"""
        with self._lock:
            self.response_times.append(response_time)
            if success:
                self.success_count += 1
            else:
                self.error_count += 1

    def stop(self):
        """Stop the adjustment thread"""
        self._stop_adjustment.set()
        if self._adjustment_thread:
            self._adjustment_thread.join(timeout=1)


class MultiTierRateLimiter:
    """Multi-tier rate limiter with different limits per user/API key"""

    def __init__(self):
        """Initialize multi-tier rate limiter"""
        self.tiers = {
            'free': {'requests_per_minute': 10, 'requests_per_hour': 100},
            'basic': {'requests_per_minute': 30, 'requests_per_hour': 500},
            'premium': {'requests_per_minute': 100, 'requests_per_hour': 2000},
            'unlimited': {'requests_per_minute': float('inf'), 'requests_per_hour': float('inf')}
        }

        # Per-user limiters
        self.user_limiters = defaultdict(dict)
        self._lock = threading.Lock()

    def get_user_tier(self, user_id: str) -> str:
        """Get user tier (would typically query database)"""
        # Simplified - in production, query user database
        if user_id.startswith("premium_"):
            return 'premium'
        elif user_id.startswith("basic_"):
            return 'basic'
        elif user_id == 'admin':
            return 'unlimited'
        else:
            return 'free'

    def is_allowed(self, user_id: str, request_type: str = 'general') -> Tuple[bool, str]:
        """
        Check if user request is allowed

        Args:
            user_id: User identifier
            request_type: Type of request

        Returns:
            Tuple of (allowed, message)
        """
        tier = self.get_user_tier(user_id)
        limits = self.tiers[tier]

        with self._lock:
            # Get or create user limiters
            if user_id not in self.user_limiters:
                self.user_limiters[user_id] = {
                    'minute': SlidingWindowRateLimiter(limits['requests_per_minute'], 60),
                    'hour': SlidingWindowRateLimiter(limits['requests_per_hour'], 3600)
                }

            limiters = self.user_limiters[user_id]

            # Check minute limit
            minute_allowed, minute_wait = limiters['minute'].is_allowed()
            if not minute_allowed:
                return False, f"Rate limit exceeded. Wait {int(minute_wait)} seconds"

            # Check hour limit
            hour_allowed, hour_wait = limiters['hour'].is_allowed()
            if not hour_allowed:
                return False, f"Hourly limit reached. Wait {int(hour_wait)} seconds"

            return True, "Request allowed"

    def get_remaining_quota(self, user_id: str) -> Dict:
        """Get remaining quota for user"""
        tier = self.get_user_tier(user_id)
        limits = self.tiers[tier]

        with self._lock:
            if user_id not in self.user_limiters:
                return {
                    'tier': tier,
                    'minute_remaining': limits['requests_per_minute'],
                    'hour_remaining': limits['requests_per_hour']
                }

            limiters = self.user_limiters[user_id]

            # Calculate remaining
            minute_used = len(limiters['minute'].requests)
            hour_used = len(limiters['hour'].requests)

            return {
                'tier': tier,
                'minute_remaining': max(0, limits['requests_per_minute'] - minute_used),
                'hour_remaining': max(0, limits['requests_per_hour'] - hour_used)
            }


class APIEndpointRateLimiter:
    """Rate limiter for specific API endpoints"""

    def __init__(self):
        """Initialize endpoint rate limiter"""
        self.endpoint_limits = {
            '/api/recognize': TokenBucketRateLimiter(capacity=20, refill_rate=1.0),
            '/api/generate': TokenBucketRateLimiter(capacity=10, refill_rate=0.5),
            '/api/search': TokenBucketRateLimiter(capacity=50, refill_rate=5.0),
            '/api/upload': TokenBucketRateLimiter(capacity=5, refill_rate=0.2),
        }

        # IP-based limiting
        self.ip_limiters = defaultdict(lambda: SlidingWindowRateLimiter(100, 60))

        self._lock = threading.Lock()

    def is_allowed(self, endpoint: str, ip_address: str) -> Tuple[bool, str]:
        """
        Check if request to endpoint is allowed

        Args:
            endpoint: API endpoint path
            ip_address: Client IP address

        Returns:
            Tuple of (allowed, message)
        """
        # Check IP limit first
        ip_allowed, ip_wait = self.ip_limiters[ip_address].is_allowed()
        if not ip_allowed:
            return False, f"IP rate limit exceeded. Wait {int(ip_wait)} seconds"

        # Check endpoint limit
        if endpoint in self.endpoint_limits:
            endpoint_allowed, endpoint_wait = self.endpoint_limits[endpoint].consume()
            if not endpoint_allowed:
                return False, f"Endpoint rate limit exceeded. Wait {int(endpoint_wait)} seconds"

        return True, "Request allowed"


class DistributedRateLimiter:
    """Rate limiter that can work across multiple instances (Redis-like)"""

    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        """
        Initialize distributed rate limiter

        Note: This is a simplified version. In production, use Redis or similar
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds

        # Simulate distributed storage with thread-safe dict
        self.storage = defaultdict(deque)
        self._lock = threading.Lock()

    def _get_key(self, identifier: str) -> str:
        """Generate storage key for identifier"""
        return hashlib.md5(identifier.encode()).hexdigest()

    def is_allowed(self, identifier: str) -> Tuple[bool, float]:
        """
        Check if request is allowed for identifier

        Args:
            identifier: Unique identifier (user_id, API key, etc.)

        Returns:
            Tuple of (allowed, wait_time)
        """
        key = self._get_key(identifier)

        with self._lock:
            current_time = time.time()
            requests = self.storage[key]

            # Clean old requests
            while requests and requests[0] < current_time - self.window_seconds:
                requests.popleft()

            if len(requests) < self.max_requests:
                requests.append(current_time)
                return True, 0.0
            else:
                wait_time = self.window_seconds - (current_time - requests[0])
                return False, wait_time

    def reset(self, identifier: str):
        """Reset rate limit for identifier"""
        key = self._get_key(identifier)
        with self._lock:
            if key in self.storage:
                del self.storage[key]


# Global rate limiter instances
_global_api_limiter = APIEndpointRateLimiter()
_global_user_limiter = MultiTierRateLimiter()
_global_adaptive_limiter = AdaptiveRateLimiter()


def check_rate_limit(user_id: str, endpoint: str, ip_address: str) -> Tuple[bool, str]:
    """
    Unified rate limit check

    Args:
        user_id: User identifier
        endpoint: API endpoint
        ip_address: Client IP

    Returns:
        Tuple of (allowed, message)
    """
    # Check user tier limit
    user_allowed, user_msg = _global_user_limiter.is_allowed(user_id)
    if not user_allowed:
        return False, user_msg

    # Check endpoint limit
    endpoint_allowed, endpoint_msg = _global_api_limiter.is_allowed(endpoint, ip_address)
    if not endpoint_allowed:
        return False, endpoint_msg

    # Check adaptive limit
    adaptive_allowed, wait_time = _global_adaptive_limiter.is_allowed()
    if not adaptive_allowed:
        return False, f"System rate limit. Wait {int(wait_time)} seconds"

    return True, "Request allowed"


def record_response_metrics(response_time: float, success: bool = True):
    """Record response metrics for adaptive rate limiting"""
    _global_adaptive_limiter.record_response(response_time, success)


def get_rate_limit_headers(user_id: str) -> Dict[str, str]:
    """Get rate limit headers for HTTP response"""
    quota = _global_user_limiter.get_remaining_quota(user_id)

    return {
        'X-RateLimit-Limit': str(quota.get('minute_remaining', 0)),
        'X-RateLimit-Remaining': str(quota.get('minute_remaining', 0)),
        'X-RateLimit-Reset': str(int(time.time()) + 60),
        'X-RateLimit-Tier': quota.get('tier', 'free')
    }