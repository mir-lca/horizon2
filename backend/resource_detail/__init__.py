import azure.functions as func
from shared.api import resource_detail


def main(req: func.HttpRequest) -> func.HttpResponse:
    return resource_detail(req)
