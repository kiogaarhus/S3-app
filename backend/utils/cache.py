"""
Cache configuration for GIDAS Explorer API.

Uses fastapi-cache2 with in-memory backend for caching GET endpoints.
Default TTL: 300 seconds (5 minutes).
"""
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache


async def init_cache():
    """
    Initialize the in-memory cache backend.

    Should be called during FastAPI app startup.
    """
    FastAPICache.init(InMemoryBackend(), prefix="gidas-cache")


async def clear_cache():
    """
    Clear all cached data.

    Should be called when data mutations occur that invalidate cached responses.
    """
    await FastAPICache.clear()


async def clear_cache_by_prefix(prefix: str):
    """
    Clear cached data matching a specific prefix.

    Args:
        prefix: Cache key prefix to clear (e.g., "dashboard", "projekttyper")
    """
    backend = FastAPICache.get_backend()
    if backend:
        # InMemoryBackend doesn't have a clear_by_prefix method,
        # so we clear all cache when targeting specific prefixes
        await FastAPICache.clear()
