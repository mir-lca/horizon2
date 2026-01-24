import azure.functions as func
from shared.api import program_detail


def main(req: func.HttpRequest) -> func.HttpResponse:
    return program_detail(req)
