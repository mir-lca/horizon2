import azure.functions as func
from shared.api import business_units


def main(req: func.HttpRequest) -> func.HttpResponse:
    return business_units(req)
