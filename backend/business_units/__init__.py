"""
DEPRECATED: Business Units API

This endpoint is deprecated. Business units are now fetched from org data.
Use /api/org-data endpoints instead:
- GET /api/org-data/divisions
- GET /api/org-data/business-units
- GET /api/org-data/business-units/{bu_id}

This endpoint now returns a 410 Gone response.
"""

import azure.functions as func
import json


def main(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps({
            "error": "This endpoint is deprecated",
            "message": "Business units are now managed via org data. Use /api/org-data endpoints instead.",
            "migration_guide": {
                "old": "/api/business-units",
                "new": "/api/org-data/business-units",
                "docs": "See ARCHITECTURE-DECISION-RECORD.md for details"
            }
        }),
        status_code=410,  # 410 Gone
        mimetype="application/json"
    )
