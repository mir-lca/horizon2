import azure.functions as func
from shared.api import business_unit_detail


def main(req: func.HttpRequest) -> func.HttpResponse:
    return business_unit_detail(req)
