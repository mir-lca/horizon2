import azure.functions as func
from shared.api import require_connection, json_response


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Debug endpoint to check database schema"""
    db, error = require_connection()
    if error:
        return error

    try:
        # Check columns in projects table
        columns = db.fetch_all("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'projects'
            ORDER BY ordinal_position
        """)

        # Try to query projects
        try:
            projects = db.fetch_all("SELECT COUNT(*) as count FROM projects")
            project_count = projects[0]["count"] if projects else 0
        except Exception as e:
            project_count = f"Error: {str(e)}"

        return json_response({
            "columns": columns,
            "project_count": project_count
        })
    except Exception as e:
        return json_response({"error": str(e)}, status_code=500)
