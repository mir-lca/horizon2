"""
DEPRECATED: Business Unit Detail API

This endpoint is deprecated. Business unit details are now fetched from org data.
Use /api/org-data/business-units/{bu_id} instead.

This endpoint now returns a 410 Gone response.
"""

import azure.functions as func
import json


def main(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps({
            "error": "This endpoint is deprecated",
            "message": "Business unit details are now managed via org data. Use /api/org-data/business-units/{bu_id} instead.",
            "migration_guide": {
                "old": "/api/business-unit-detail/{id}",
                "new": "/api/org-data/business-units/{bu_id}",
                "docs": "See ARCHITECTURE-DECISION-RECORD.md for details"
            }
        }),
        status_code=410,
        mimetype="application/json"
    )
