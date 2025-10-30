"""
Dashboard state management for GIDAS Explorer.

Example implementation showing how to use BaseState for API calls.
"""
from typing import Dict, Any
from app.state.base import BaseState


class DashboardState(BaseState):
    """
    State management for dashboard page.

    Manages dashboard statistics and recent activity data fetched from backend API.
    """

    # Dashboard statistics
    stats: Dict[str, Any] = {}
    recent_activity: list[Dict[str, Any]] = []

    # Pagination for recent activity
    activity_page: int = 1
    activity_per_page: int = 20
    activity_total: int = 0

    async def load_dashboard_stats(self):
        """
        Load dashboard statistics from backend API.

        Fetches aggregated statistics including project counts, event counts, etc.
        Updates self.stats on success, sets error_message on failure.
        """
        result = await self.api_get("/api/dashboard/stats")

        if result and result.get("success"):
            self.stats = result.get("data", {})

    async def load_recent_activity(self, page: int = 1):
        """
        Load recent activity with pagination.

        Args:
            page: Page number to load (1-indexed)
        """
        params = {
            "page": page,
            "per_page": self.activity_per_page
        }

        result = await self.api_get("/api/dashboard/recent-activity", params=params)

        if result and result.get("success"):
            self.recent_activity = result.get("data", [])
            self.activity_page = page

            # Update pagination info
            pagination = result.get("pagination", {})
            self.activity_total = pagination.get("total", 0)

    async def refresh_dashboard(self):
        """
        Refresh all dashboard data.

        Loads both statistics and recent activity in sequence.
        """
        await self.load_dashboard_stats()
        await self.load_recent_activity(page=1)

    async def next_activity_page(self):
        """Load next page of recent activity."""
        await self.load_recent_activity(page=self.activity_page + 1)

    async def prev_activity_page(self):
        """Load previous page of recent activity."""
        if self.activity_page > 1:
            await self.load_recent_activity(page=self.activity_page - 1)
