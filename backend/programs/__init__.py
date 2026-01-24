import azure.functions as func
from shared.api import programs


def main(req: func.HttpRequest) -> func.HttpResponse:
    return programs(req)
