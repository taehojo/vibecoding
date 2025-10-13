"""
Advanced caching system with multiple strategies and TTL support
"""
import time
import hashlib
import pickle
import threading
from collections import OrderedDict
from typing import Any, Optional, Callable, Dict
import logging
from functools import wraps

logger = logging.getLogger(__name__)

class LRUCache:
    """Least Recently Used (LRU) cache implementation"""

    def __init__(self, max_size: int = 100, ttl: int = 3600):
        """
        Initialize LRU cache

        Args:
            max_size: Maximum number of items in cache
            ttl: Time-to-live in seconds
        """
        self.max_size = max_size
        self.ttl = ttl
        self.cache = OrderedDict()
        self.timestamps = {}
        self._lock = threading.RLock()
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        """Get item from cache"""
        with self._lock:
            if key not in self.cache:
                self.misses += 1
                return None

            # Check TTL
            if self.ttl > 0:
                if time.time() - self.timestamps[key] > self.ttl:
                    # Expired
                    del self.cache[key]
                    del self.timestamps[key]
                    self.misses += 1
                    return None

            # Move to end (most recently used)
            self.cache.move_to_end(key)
            self.hits += 1
            return self.cache[key]

    def set(self, key: str, value: Any):
        """Set item in cache"""
        with self._lock:
            # Remove oldest if at capacity
            if key not in self.cache and len(self.cache) >= self.max_size:
                # Remove least recently used
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]
                if oldest_key in self.timestamps:
                    del self.timestamps[oldest_key]

            self.cache[key] = value
            self.timestamps[key] = time.time()

            # Move to end
            self.cache.move_to_end(key)

    def invalidate(self, key: Optional[str] = None):
        """Invalidate cache entries"""
        with self._lock:
            if key:
                self.cache.pop(key, None)
                self.timestamps.pop(key, None)
            else:
                self.cache.clear()
                self.timestamps.clear()

    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = self.hits / total_requests if total_requests > 0 else 0

        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': hit_rate,
            'total_requests': total_requests
        }


class TTLCache:
    """Time-based cache with automatic expiration"""

    def __init__(self, default_ttl: int = 300):
        """
        Initialize TTL cache

        Args:
            default_ttl: Default TTL in seconds
        """
        self.default_ttl = default_ttl
        self.cache = {}
        self.expiry_times = {}
        self._lock = threading.RLock()

        # Start cleanup thread
        self._cleanup_thread = threading.Thread(target=self._cleanup_worker)
        self._cleanup_thread.daemon = True
        self._stop_cleanup = threading.Event()
        self._cleanup_thread.start()

    def _cleanup_worker(self):
        """Background worker to clean expired entries"""
        while not self._stop_cleanup.is_set():
            try:
                self._remove_expired()
                self._stop_cleanup.wait(60)  # Check every minute
            except Exception as e:
                logger.error(f"Cache cleanup error: {e}")

    def _remove_expired(self):
        """Remove expired entries"""
        with self._lock:
            current_time = time.time()
            expired_keys = [
                key for key, expiry in self.expiry_times.items()
                if current_time > expiry
            ]

            for key in expired_keys:
                del self.cache[key]
                del self.expiry_times[key]

            if expired_keys:
                logger.debug(f"Removed {len(expired_keys)} expired cache entries")

    def get(self, key: str) -> Optional[Any]:
        """Get item from cache"""
        with self._lock:
            if key not in self.cache:
                return None

            # Check expiration
            if time.time() > self.expiry_times[key]:
                del self.cache[key]
                del self.expiry_times[key]
                return None

            return self.cache[key]

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set item in cache with TTL

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if not provided)
        """
        with self._lock:
            ttl = ttl or self.default_ttl
            self.cache[key] = value
            self.expiry_times[key] = time.time() + ttl

    def invalidate(self, pattern: Optional[str] = None):
        """Invalidate cache entries matching pattern"""
        with self._lock:
            if pattern:
                keys_to_remove = [
                    key for key in self.cache.keys()
                    if pattern in key
                ]
                for key in keys_to_remove:
                    del self.cache[key]
                    del self.expiry_times[key]
            else:
                self.cache.clear()
                self.expiry_times.clear()

    def stop(self):
        """Stop cleanup thread"""
        self._stop_cleanup.set()


class MultiLayerCache:
    """Multi-layer cache with L1 (memory) and L2 (disk) layers"""

    def __init__(self, l1_size: int = 100, l2_enabled: bool = False, cache_dir: str = "/tmp/cache"):
        """
        Initialize multi-layer cache

        Args:
            l1_size: Size of L1 (memory) cache
            l2_enabled: Enable L2 (disk) cache
            cache_dir: Directory for L2 cache
        """
        self.l1_cache = LRUCache(max_size=l1_size, ttl=300)
        self.l2_enabled = l2_enabled
        self.cache_dir = cache_dir

        if l2_enabled:
            import os
            os.makedirs(cache_dir, exist_ok=True)

        self._lock = threading.RLock()

    def _get_l2_path(self, key: str) -> str:
        """Get L2 cache file path"""
        key_hash = hashlib.md5(key.encode()).hexdigest()
        return f"{self.cache_dir}/{key_hash}.cache"

    def get(self, key: str) -> Optional[Any]:
        """Get item from cache (checks L1, then L2)"""
        # Check L1
        value = self.l1_cache.get(key)
        if value is not None:
            return value

        # Check L2 if enabled
        if self.l2_enabled:
            with self._lock:
                l2_path = self._get_l2_path(key)
                try:
                    import os
                    if os.path.exists(l2_path):
                        # Check if not expired (1 hour TTL for L2)
                        if time.time() - os.path.getmtime(l2_path) < 3600:
                            with open(l2_path, 'rb') as f:
                                value = pickle.load(f)

                            # Promote to L1
                            self.l1_cache.set(key, value)
                            return value
                        else:
                            # Expired, remove
                            os.remove(l2_path)
                except Exception as e:
                    logger.error(f"L2 cache read error: {e}")

        return None

    def set(self, key: str, value: Any):
        """Set item in cache (both L1 and L2)"""
        # Set in L1
        self.l1_cache.set(key, value)

        # Set in L2 if enabled
        if self.l2_enabled:
            with self._lock:
                try:
                    l2_path = self._get_l2_path(key)
                    with open(l2_path, 'wb') as f:
                        pickle.dump(value, f)
                except Exception as e:
                    logger.error(f"L2 cache write error: {e}")

    def invalidate(self, key: Optional[str] = None):
        """Invalidate cache entries"""
        self.l1_cache.invalidate(key)

        if self.l2_enabled:
            with self._lock:
                if key:
                    # Remove specific key
                    l2_path = self._get_l2_path(key)
                    try:
                        import os
                        if os.path.exists(l2_path):
                            os.remove(l2_path)
                    except:
                        pass
                else:
                    # Clear all L2 cache
                    try:
                        import os
                        import glob
                        for cache_file in glob.glob(f"{self.cache_dir}/*.cache"):
                            os.remove(cache_file)
                    except:
                        pass


class CacheManager:
    """Unified cache manager with multiple strategies"""

    def __init__(self):
        """Initialize cache manager"""
        # Different cache strategies for different use cases
        self.caches = {
            'default': LRUCache(max_size=200, ttl=600),
            'short': TTLCache(default_ttl=60),
            'long': LRUCache(max_size=100, ttl=3600),
            'permanent': LRUCache(max_size=50, ttl=0),  # No TTL
            'multi': MultiLayerCache(l1_size=100, l2_enabled=False)
        }

        self._lock = threading.Lock()

    def get(self, key: str, cache_type: str = 'default') -> Optional[Any]:
        """Get item from specified cache"""
        if cache_type in self.caches:
            return self.caches[cache_type].get(key)
        return None

    def set(self, key: str, value: Any, cache_type: str = 'default', ttl: Optional[int] = None):
        """Set item in specified cache"""
        if cache_type in self.caches:
            cache = self.caches[cache_type]
            if isinstance(cache, TTLCache) and ttl is not None:
                cache.set(key, value, ttl)
            else:
                cache.set(key, value)

    def invalidate(self, key: Optional[str] = None, cache_type: Optional[str] = None):
        """Invalidate cache entries"""
        with self._lock:
            if cache_type:
                if cache_type in self.caches:
                    self.caches[cache_type].invalidate(key)
            else:
                # Invalidate all caches
                for cache in self.caches.values():
                    cache.invalidate(key)

    def get_stats(self) -> Dict:
        """Get statistics for all caches"""
        stats = {}
        for name, cache in self.caches.items():
            if hasattr(cache, 'get_stats'):
                stats[name] = cache.get_stats()
            elif hasattr(cache, 'l1_cache'):
                stats[name] = cache.l1_cache.get_stats()
        return stats


# Global cache manager
_cache_manager = CacheManager()


def cached(cache_type: str = 'default', ttl: Optional[int] = None,
          key_func: Optional[Callable] = None):
    """
    Decorator for caching function results

    Args:
        cache_type: Type of cache to use
        ttl: Time-to-live in seconds
        key_func: Function to generate cache key from arguments
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default key generation
                key_parts = [func.__module__, func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                cache_key = ":".join(key_parts)

            # Try to get from cache
            cached_value = _cache_manager.get(cache_key, cache_type)
            if cached_value is not None:
                logger.debug(f"Cache hit for {func.__name__}")
                return cached_value

            # Execute function
            result = func(*args, **kwargs)

            # Cache the result
            _cache_manager.set(cache_key, result, cache_type, ttl)
            logger.debug(f"Cached result for {func.__name__}")

            return result

        # Add cache control methods
        wrapper.invalidate_cache = lambda: _cache_manager.invalidate(
            key=None, cache_type=cache_type
        )

        return wrapper
    return decorator


def cache_get(key: str, cache_type: str = 'default') -> Optional[Any]:
    """Get item from cache"""
    return _cache_manager.get(key, cache_type)


def cache_set(key: str, value: Any, cache_type: str = 'default', ttl: Optional[int] = None):
    """Set item in cache"""
    _cache_manager.set(key, value, cache_type, ttl)


def cache_invalidate(key: Optional[str] = None, cache_type: Optional[str] = None):
    """Invalidate cache entries"""
    _cache_manager.invalidate(key, cache_type)


def get_cache_stats() -> Dict:
    """Get cache statistics"""
    return _cache_manager.get_stats()


# Example usage with different caching strategies
@cached(cache_type='short', ttl=30)
def fetch_user_data(user_id: str):
    """Example: Cache user data for 30 seconds"""
    pass


@cached(cache_type='long', ttl=3600)
def expensive_calculation(param1, param2):
    """Example: Cache expensive calculations for 1 hour"""
    pass


@cached(cache_type='permanent')
def get_static_config():
    """Example: Cache static configuration permanently"""
    pass