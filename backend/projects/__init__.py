import azure.functions as func
from shared.api import projects
import logging

logger = logging.getLogger(__name__)

def main(req: func.HttpRequest) -> func.HttpResponse:
    logger.info("projects/__init__.py main() called")
    try:
        result = projects(req)
        logger.info(f"projects() returned status {result.status_code}")
        return result
    except Exception as e:
        logger.error(f"ERROR in projects main(): {e}")
        import traceback
        traceback.print_exc()
        raise
