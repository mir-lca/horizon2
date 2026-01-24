import azure.functions as func
from shared.api import financial_impact


def main(req: func.HttpRequest) -> func.HttpResponse:
    return financial_impact(req)
