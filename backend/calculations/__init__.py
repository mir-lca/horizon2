import azure.functions as func
from shared.api import calculations


def main(req: func.HttpRequest) -> func.HttpResponse:
    return calculations(req)
