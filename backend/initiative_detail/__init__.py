import azure.functions as func
from shared.api import initiative_detail


def main(req: func.HttpRequest) -> func.HttpResponse:
    return initiative_detail(req)
