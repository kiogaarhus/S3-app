"""
Base State class for GIDAS Explorer with async API client capabilities.
"""
import os
import time
from typing import Any, Dict, Optional
import httpx
import reflex as rx


class BaseState(rx.State):
    """
    Base state class with async HTTP API client functionality.

    All application states should inherit from this class to get
    standardized API calling capabilities with loading and error handling.

    Attributes:
        loading: Boolean flag indicating if an API call is in progress
        error_message: Optional error message from failed API calls
        _api_base_url: Configurable base URL for API calls
        _api_timeout: Request timeout in seconds
        _api_cache: Client-side cache for GET responses with TTL
        _cache_ttl: Default cache TTL in seconds (300 = 5 minutes)
    """

    # Public state vars
    loading: bool = False
    error_message: Optional[str] = None

    # Configuration (class variables with defaults)
    _api_base_url: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    _api_timeout: float = 30.0
    _api_headers: Dict[str, str] = {}

    # Client-side cache: {cache_key: {"data": response_data, "timestamp": unix_timestamp}}
    _api_cache: Dict[str, Dict[str, Any]] = {}
    _cache_ttl: float = 300.0  # 5 minutes default TTL

    @classmethod
    def set_api_base_url(cls, url: str) -> None:
        """
        Set the base URL for API calls.

        Args:
            url: Base URL (e.g., "http://localhost:8000")
        """
        cls._api_base_url = url

    @classmethod
    def set_api_timeout(cls, timeout: float) -> None:
        """
        Set the default timeout for API calls.

        Args:
            timeout: Timeout in seconds
        """
        cls._api_timeout = timeout

    @classmethod
    def set_api_headers(cls, headers: Dict[str, str]) -> None:
        """
        Set default headers for all API calls.

        Args:
            headers: Dictionary of header key-value pairs
        """
        cls._api_headers = headers

    @classmethod
    def set_cache_ttl(cls, ttl: float) -> None:
        """
        Set the default cache TTL in seconds.

        Args:
            ttl: Time-to-live in seconds (e.g., 300 for 5 minutes)
        """
        cls._cache_ttl = ttl

    @classmethod
    def clear_api_cache(cls) -> None:
        """Clear all cached API responses."""
        cls._api_cache = {}

    def clear_error(self) -> None:
        """Clear the error message."""
        self.error_message = None

    def _get_cache_key(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate cache key for an endpoint and params.

        Args:
            endpoint: API endpoint
            params: Query parameters

        Returns:
            Cache key string
        """
        import json
        params_str = json.dumps(params, sort_keys=True) if params else ""
        return f"{endpoint}?{params_str}"

    def _get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Get cached response if valid (not expired).

        Args:
            cache_key: Cache key

        Returns:
            Cached response data or None if expired/missing
        """
        if cache_key not in self._api_cache:
            return None

        cached = self._api_cache[cache_key]
        timestamp = cached.get("timestamp", 0)
        current_time = time.time()

        # Check if cache is still valid
        if current_time - timestamp < self._cache_ttl:
            return cached.get("data")

        # Cache expired, remove it
        del self._api_cache[cache_key]
        return None

    def _set_cached_response(self, cache_key: str, data: Dict[str, Any]) -> None:
        """
        Cache a response with current timestamp.

        Args:
            cache_key: Cache key
            data: Response data to cache
        """
        self._api_cache[cache_key] = {
            "data": data,
            "timestamp": time.time()
        }

    async def api_call(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[float] = None,
        raise_on_error: bool = False,
        use_cache: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Make an async HTTP API call with automatic loading and error handling.

        Args:
            endpoint: API endpoint path (e.g., "/api/dashboard/stats")
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            data: Optional request body data (will be sent as JSON)
            params: Optional query parameters
            headers: Optional additional headers (merged with default headers)
            timeout: Optional request timeout (overrides default)
            raise_on_error: If True, raise exceptions instead of setting error_message
            use_cache: If True, cache GET requests (default: True)

        Returns:
            Response JSON data as dictionary, or None if request failed

        Raises:
            httpx.HTTPError: If raise_on_error=True and request fails

        Example:
            ```python
            class DashboardState(BaseState):
                stats: Dict[str, Any] = {}

                async def load_stats(self):
                    result = await self.api_call("/api/dashboard/stats")
                    if result and result.get("success"):
                        self.stats = result.get("data", {})
            ```
        """
        # Check cache for GET requests
        if method.upper() == "GET" and use_cache:
            cache_key = self._get_cache_key(endpoint, params)
            cached_response = self._get_cached_response(cache_key)

            if cached_response is not None:
                # Return cached response without setting loading state
                return cached_response

        # Set loading state
        self.loading = True
        self.error_message = None

        try:
            # Build full URL
            url = f"{self._api_base_url}{endpoint}"

            # Merge headers
            request_headers = {**self._api_headers}
            if headers:
                request_headers.update(headers)

            # Use provided timeout or default
            request_timeout = timeout if timeout is not None else self._api_timeout

            # Make async request
            async with httpx.AsyncClient(timeout=request_timeout) as client:
                response = await client.request(
                    method=method.upper(),
                    url=url,
                    json=data,
                    params=params,
                    headers=request_headers
                )

                # Raise for HTTP errors (4xx, 5xx)
                response.raise_for_status()

                # Get JSON response
                json_response = response.json()

                # Cache GET responses
                if method.upper() == "GET" and use_cache:
                    cache_key = self._get_cache_key(endpoint, params)
                    self._set_cached_response(cache_key, json_response)

                return json_response

        except httpx.HTTPStatusError as e:
            error_msg = f"HTTP {e.response.status_code}: {e.response.text}"
            self.error_message = error_msg

            if raise_on_error:
                raise

            return None

        except httpx.TimeoutException as e:
            error_msg = f"Request timeout after {request_timeout}s"
            self.error_message = error_msg

            if raise_on_error:
                raise

            return None

        except httpx.RequestError as e:
            error_msg = f"Request error: {str(e)}"
            self.error_message = error_msg

            if raise_on_error:
                raise

            return None

        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            self.error_message = error_msg

            if raise_on_error:
                raise

            return None

        finally:
            # Clear loading state
            self.loading = False

    async def api_get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        Convenience method for GET requests.

        Args:
            endpoint: API endpoint path
            params: Optional query parameters
            **kwargs: Additional arguments passed to api_call

        Returns:
            Response JSON data as dictionary, or None if request failed
        """
        return await self.api_call(endpoint, method="GET", params=params, **kwargs)

    async def api_post(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        Convenience method for POST requests.

        Args:
            endpoint: API endpoint path
            data: Request body data
            **kwargs: Additional arguments passed to api_call

        Returns:
            Response JSON data as dictionary, or None if request failed
        """
        return await self.api_call(endpoint, method="POST", data=data, **kwargs)

    async def api_put(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        Convenience method for PUT requests.

        Args:
            endpoint: API endpoint path
            data: Request body data
            **kwargs: Additional arguments passed to api_call

        Returns:
            Response JSON data as dictionary, or None if request failed
        """
        return await self.api_call(endpoint, method="PUT", data=data, **kwargs)

    async def api_delete(
        self,
        endpoint: str,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        Convenience method for DELETE requests.

        Args:
            endpoint: API endpoint path
            **kwargs: Additional arguments passed to api_call

        Returns:
            Response JSON data as dictionary, or None if request failed
        """
        return await self.api_call(endpoint, method="DELETE", **kwargs)
