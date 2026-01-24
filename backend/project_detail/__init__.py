import azure.functions as func
from shared.api import project_detail


def main(req: func.HttpRequest) -> func.HttpResponse:
    return project_detail(req)
