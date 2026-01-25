import azure.functions as func
from shared.api import project_list_handler


def main(req: func.HttpRequest) -> func.HttpResponse:
    return project_list_handler(req)
