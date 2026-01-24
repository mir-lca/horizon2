import azure.functions as func
from shared.api import resource_gaps


def main(req: func.HttpRequest) -> func.HttpResponse:
    return resource_gaps(req)
