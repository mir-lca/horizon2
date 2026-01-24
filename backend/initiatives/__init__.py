import azure.functions as func
from shared.api import initiatives


def main(req: func.HttpRequest) -> func.HttpResponse:
    return initiatives(req)
