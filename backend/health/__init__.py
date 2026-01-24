import azure.functions as func
from shared.api import health


def main(req: func.HttpRequest) -> func.HttpResponse:
    return health(req)
