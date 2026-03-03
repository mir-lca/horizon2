"""
Org Data Service - Fetch and cache organizational data from CDN.

This service provides access to the org-hierarchy.json from the org-data-sync-function
as the single source of truth for organizational structure.

CDN URL: https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json
Update frequency: Weekly (Sunday 6 AM UTC)
"""

import logging
import time
from typing import List, Dict, Optional
import urllib.request
import json

logger = logging.getLogger(__name__)


class OrgDataService:
    """
    Service for fetching organizational data from CDN with caching.

    Features:
    - Fetches from CDN with 5-minute in-memory cache
    - Parses org hierarchy JSON structure
    - Graceful degradation if CDN unavailable (use stale cache up to 24 hours)
    - Helper functions for validation and lookup
    """

    CDN_URL = "https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json"
    CACHE_TTL = 300  # 5 minutes
    STALE_CACHE_TTL = 86400  # 24 hours (for fallback when CDN unavailable)

    def __init__(self):
        self._cache: Optional[Dict] = None
        self._cache_time: float = 0
        self._request_timeout = 10  # 10 seconds timeout for CDN requests

    async def fetch_org_hierarchy(self) -> Dict:
        """
        Fetch org hierarchy from CDN with caching.

        Returns:
            Dict containing org hierarchy with structure:
            {
                "version": "1.0.0",
                "generated_at": "ISO 8601 timestamp",
                "employees": [...],
                "summary": {
                    "divisions": [...],
                    "functions": [...]
                }
            }
        """
        current_time = time.time()

        # Check if cache is still valid (< 5 minutes old)
        if self._cache and (current_time - self._cache_time) < self.CACHE_TTL:
            logger.debug("Returning org data from cache (fresh)")
            return self._cache

        # Try to fetch from CDN
        try:
            logger.info(f"Fetching org data from CDN: {self.CDN_URL}")
            req = urllib.request.Request(self.CDN_URL)
            req.add_header('User-Agent', 'Horizon-Backend/1.0')

            with urllib.request.urlopen(req, timeout=self._request_timeout) as response:
                data = json.loads(response.read().decode('utf-8'))

                # Validate schema
                if not self._validate_org_data_schema(data):
                    logger.error("Invalid org data schema received from CDN")
                    if self._cache and (current_time - self._cache_time) < self.STALE_CACHE_TTL:
                        logger.warning("Using stale cache due to invalid schema")
                        return self._cache
                    raise ValueError("Invalid org data schema and no valid cache available")

                # Update cache
                self._cache = data
                self._cache_time = current_time
                logger.info(f"Org data fetched successfully (version: {data.get('version', 'unknown')})")
                return data

        except Exception as e:
            logger.error(f"Failed to fetch org data from CDN: {e}")

            # Fallback to stale cache if available (up to 24 hours old)
            if self._cache and (current_time - self._cache_time) < self.STALE_CACHE_TTL:
                logger.warning(f"Using stale cache (age: {int(current_time - self._cache_time)}s)")
                return self._cache

            # No valid cache available
            logger.error("No valid cache available, returning empty org data")
            return self._get_empty_org_data()

    def _validate_org_data_schema(self, data: Dict) -> bool:
        """Validate that org data has expected structure."""
        required_fields = ['version', 'employees', 'summary']
        if not all(field in data for field in required_fields):
            logger.error(f"Missing required fields in org data. Expected: {required_fields}")
            return False

        if 'divisions' not in data.get('summary', {}):
            logger.error("Missing 'divisions' in summary")
            return False

        return True

    def _get_empty_org_data(self) -> Dict:
        """Return empty org data structure for fallback."""
        return {
            "version": "0.0.0",
            "generated_at": "",
            "employees": [],
            "summary": {
                "divisions": [],
                "functions": []
            }
        }

    async def get_divisions(self) -> List[Dict]:
        """
        Get all divisions.

        Returns:
            List of divisions with structure:
            [
                {
                    "id": "robotics",
                    "name": "Robotics",
                    "headcount": 1500,
                    "businessUnits": [...]
                }
            ]
        """
        org_data = await self.fetch_org_hierarchy()
        return org_data.get('summary', {}).get('divisions', [])

    async def get_business_units(self, division_id: Optional[str] = None) -> List[Dict]:
        """
        Get all business units, optionally filtered by division.

        Args:
            division_id: Optional division ID to filter by (e.g., "robotics")

        Returns:
            List of business units with structure:
            [
                {
                    "id": "ur",
                    "name": "Universal Robots (UR)",
                    "headcount": 900,
                    "division": "Robotics",
                    "divisionId": "robotics",
                    "functions": [...]
                }
            ]
        """
        divisions = await self.get_divisions()

        if division_id:
            # Filter by specific division
            division = next((d for d in divisions if d.get('id') == division_id), None)
            if not division:
                logger.warning(f"Division not found: {division_id}")
                return []
            return division.get('businessUnits', [])

        # Return all business units across all divisions
        all_bus = []
        for division in divisions:
            bus = division.get('businessUnits', [])
            # Add division context to each BU
            for bu in bus:
                bu['division'] = division.get('name')
                bu['divisionId'] = division.get('id')
            all_bus.extend(bus)

        return all_bus

    async def get_business_unit(self, bu_id: str) -> Optional[Dict]:
        """
        Get specific business unit by ID.

        Args:
            bu_id: Business unit ID (e.g., "ur", "mir")

        Returns:
            Business unit dict or None if not found
        """
        all_bus = await self.get_business_units()
        return next((bu for bu in all_bus if bu.get('id') == bu_id), None)

    async def get_employees_by_business_unit(self, bu_id: str) -> List[Dict]:
        """
        Get all employees in a business unit.

        Args:
            bu_id: Business unit ID (e.g., "ur")

        Returns:
            List of employees
        """
        org_data = await self.fetch_org_hierarchy()
        employees = org_data.get('employees', [])

        return [
            emp for emp in employees
            if emp.get('businessUnitId') == bu_id
        ]

    async def get_function_categories(self) -> List[Dict]:
        """
        Get all function categories.

        Returns:
            List of functions with structure:
            [
                {
                    "id": "engineering-software",
                    "name": "Engineering - Software",
                    "headcount": 200
                }
            ]
        """
        org_data = await self.fetch_org_hierarchy()
        return org_data.get('summary', {}).get('functions', [])

    def validate_business_unit(self, bu_id: str) -> bool:
        """
        Check if business unit ID exists in org data (synchronous).

        Note: This uses cached data only and doesn't trigger a fetch.
        For validation with fresh data, use validate_business_unit_async.

        Args:
            bu_id: Business unit ID to validate

        Returns:
            True if BU exists, False otherwise
        """
        if not self._cache:
            logger.warning("No org data cache available for validation")
            return False

        divisions = self._cache.get('summary', {}).get('divisions', [])
        for division in divisions:
            for bu in division.get('businessUnits', []):
                if bu.get('id') == bu_id:
                    return True

        return False

    async def validate_business_unit_async(self, bu_id: str) -> bool:
        """
        Check if business unit ID exists in org data (async, fetches if needed).

        Args:
            bu_id: Business unit ID to validate

        Returns:
            True if BU exists, False otherwise
        """
        bu = await self.get_business_unit(bu_id)
        return bu is not None

    async def search_employees(
        self,
        query: str,
        bu_id: Optional[str] = None,
        function: Optional[str] = None
    ) -> List[Dict]:
        """
        Search employees by name/email with filters.

        Args:
            query: Search query (name or email)
            bu_id: Optional business unit filter
            function: Optional function category filter

        Returns:
            List of matching employees
        """
        org_data = await self.fetch_org_hierarchy()
        employees = org_data.get('employees', [])

        # Apply filters
        results = []
        query_lower = query.lower()

        for emp in employees:
            # Filter by BU
            if bu_id and emp.get('businessUnitId') != bu_id:
                continue

            # Filter by function
            if function and emp.get('functionCategory') != function:
                continue

            # Search by name or email
            display_name = emp.get('displayName', '').lower()
            email = emp.get('email', '').lower()

            if query_lower in display_name or query_lower in email:
                results.append(emp)

        return results

    async def get_business_unit_ids_by_division(self, division_id: str) -> List[str]:
        """
        Get all business unit IDs in a division.

        Args:
            division_id: Division ID (e.g., "robotics")

        Returns:
            List of BU IDs (e.g., ["ur", "mir"])
        """
        divisions = await self.get_divisions()
        division = next((d for d in divisions if d.get('id') == division_id), None)

        if not division:
            return []

        return [bu.get('id') for bu in division.get('businessUnits', []) if bu.get('id')]


# Global singleton instance
_org_data_service: Optional[OrgDataService] = None


def get_org_data_service() -> OrgDataService:
    """Get or create the global org data service instance."""
    global _org_data_service
    if _org_data_service is None:
        _org_data_service = OrgDataService()
        logger.info("Org data service initialized")
    return _org_data_service
