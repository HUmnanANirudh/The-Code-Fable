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

    response = {
        "job_id": job_id,
        "status": task.status,
        "result": task.result if task.ready() else None,
    }
    return response