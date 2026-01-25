import azure.functions as func
import json


def main(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        body=json.dumps({"status": "minimal test working"}),
        status_code=200,
        mimetype="application/json"
    )
