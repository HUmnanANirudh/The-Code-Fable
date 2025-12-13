import os
import sys
from fastapi import APIRouter, HTTPException

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.core.db_client import db_client
from worker.worker import celery_app

router = APIRouter()

@router.get("/status/{job_id}")
def get_status(job_id: str):
    """
    Retrieves the status of an analysis job.
    """
    task = celery_app.AsyncResult(job_id)
    
    if task is None:
        raise HTTPException(status_code=404, detail="Job not found")

    status = task.status
    result = None

    if task.ready():
        if status == "SUCCESS" and isinstance(task.result, dict) and "status" in task.result:
            # Task completed, use the internal status from analyze_repository's return
            status = task.result["status"]
            result = task.result["result"] # Return the actual result
        elif status == "FAILURE":
            # Celery task itself failed
            status = "failed"
            result = {"error": str(task.result)} # Provide error details
        else:
            # Unexpected state, but task is ready
            status = "failed"
            result = {"error": "Unknown task completion state."}
    
    response = {
        "job_id": job_id,
        "status": status,
        "result": result,
    }
    return response