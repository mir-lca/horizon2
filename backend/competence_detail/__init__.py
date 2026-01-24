import azure.functions as func
from shared.api import competence_detail


def main(req: func.HttpRequest) -> func.HttpResponse:
    return competence_detail(req)
