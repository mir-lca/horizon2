"""
Org Data API Endpoints

Provides access to organizational data from org-data-sync-function.
Acts as a caching layer between frontend and CDN.

Endpoints:
- GET /api/org-data/divisions - Get all divisions
- GET /api/org-data/business-units - Get business units (optionally filtered by division)
- GET /api/org-data/business-units/{bu_id} - Get specific business unit
- GET /api/org-data/employees - Search/filter employees
- GET /api/org-data/validate - Validate business unit ID
"""

import azure.functions as func
import logging
import json
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.org_data_service import get_org_data_service

logger = logging.getLogger(__name__)


async def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Main entry point for org data API.

    Routes:
    - /divisions
    - /business-units
    - /business-units/{id}
    - /employees
    - /validate
    """
    logger.info(f"Org data API request: {req.method} {req.url}")

    try:
        # Get route path
        route = req.route_params.get('route', '')
        logger.info(f"Route: {route}")

        # Handle different routes
        if route == 'divisions' or req.url.endswith('/divisions'):
            return await handle_get_divisions(req)
        elif route == 'business-units' or '/business-units' in req.url:
            # Check if it's a specific BU request
            parts = req.url.split('/business-units/')
            if len(parts) > 1 and parts[1].strip('/'):
                bu_id = parts[1].strip('/').split('?')[0]
                return await handle_get_business_unit(req, bu_id)
            else:
                return await handle_get_business_units(req)
        elif route == 'employees' or req.url.endswith('/employees'):
            return await handle_search_employees(req)
        elif route == 'validate' or req.url.endswith('/validate'):
            return await handle_validate_business_unit(req)
        else:
            return func.HttpResponse(
                json.dumps({"error": "Unknown route", "route": route}),
                status_code=404,
                mimetype="application/json"
            )

    except Exception as e:
        logger.error(f"Error in org data API: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )


async def handle_get_divisions(req: func.HttpRequest) -> func.HttpResponse:
    """
    GET /api/org-data/divisions

    Returns all divisions with business units.
    """
    try:
        service = get_org_data_service()
        divisions = await service.get_divisions()

        return func.HttpResponse(
            json.dumps({"divisions": divisions}),
            status_code=200,
            mimetype="application/json",
            headers={"Cache-Control": "public, max-age=300"}  # 5 minute cache
        )

    except Exception as e:
        logger.error(f"Error getting divisions: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )


async def handle_get_business_units(req: func.HttpRequest) -> func.HttpResponse:
    """
    GET /api/org-data/business-units?division=robotics

    Returns business units, optionally filtered by division.
    """
    try:
        service = get_org_data_service()

        # Get optional division filter
        division_id = req.params.get('division')

        business_units = await service.get_business_units(division_id)

        return func.HttpResponse(
            json.dumps({"businessUnits": business_units}),
            status_code=200,
            mimetype="application/json",
            headers={"Cache-Control": "public, max-age=300"}
        )

    except Exception as e:
        logger.error(f"Error getting business units: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )


async def handle_get_business_unit(req: func.HttpRequest, bu_id: str) -> func.HttpResponse:
    """
    GET /api/org-data/business-units/{bu_id}

    Returns specific business unit details.
    """
    try:
        service = get_org_data_service()
        bu = await service.get_business_unit(bu_id)

        if not bu:
            return func.HttpResponse(
                json.dumps({"error": f"Business unit not found: {bu_id}"}),
                status_code=404,
                mimetype="application/json"
            )

        return func.HttpResponse(
            json.dumps({"businessUnit": bu}),
            status_code=200,
            mimetype="application/json",
            headers={"Cache-Control": "public, max-age=300"}
        )

    except Exception as e:
        logger.error(f"Error getting business unit {bu_id}: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )


async def handle_search_employees(req: func.HttpRequest) -> func.HttpResponse:
    """
    GET /api/org-data/employees?business_unit=ur&function=engineering-software&search=john

    Search/filter employees.
    """
    try:
        service = get_org_data_service()

        # Get query parameters
        bu_id = req.params.get('business_unit')
        function = req.params.get('function')
        search_query = req.params.get('search', req.params.get('query', ''))

        if not search_query and not bu_id:
            return func.HttpResponse(
                json.dumps({"error": "At least one of 'search' or 'business_unit' parameter required"}),
                status_code=400,
                mimetype="application/json"
            )

        # If only BU filter, get all employees in BU
        if bu_id and not search_query:
            employees = await service.get_employees_by_business_unit(bu_id)
        else:
            employees = await service.search_employees(
                query=search_query or '',
                bu_id=bu_id,
                function=function
            )

        return func.HttpResponse(
            json.dumps({"employees": employees, "count": len(employees)}),
            status_code=200,
            mimetype="application/json",
            headers={"Cache-Control": "public, max-age=300"}
        )

    except Exception as e:
        logger.error(f"Error searching employees: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )


async def handle_validate_business_unit(req: func.HttpRequest) -> func.HttpResponse:
    """
    GET /api/org-data/validate?business_unit_id=ur

    Validate that a business unit ID exists.
    """
    try:
        service = get_org_data_service()

        bu_id = req.params.get('business_unit_id')
        if not bu_id:
            return func.HttpResponse(
                json.dumps({"error": "business_unit_id parameter required"}),
                status_code=400,
                mimetype="application/json"
            )

        is_valid = await service.validate_business_unit_async(bu_id)

        if is_valid:
            bu = await service.get_business_unit(bu_id)
            return func.HttpResponse(
                json.dumps({"valid": True, "businessUnit": bu}),
                status_code=200,
                mimetype="application/json"
            )
        else:
            return func.HttpResponse(
                json.dumps({"valid": False, "error": f"Business unit not found: {bu_id}"}),
                status_code=200,  # 200 with valid=false, not 404
                mimetype="application/json"
            )

    except Exception as e:
        logger.error(f"Error validating business unit: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )
