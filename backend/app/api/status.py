import os
import sys
import uuid
from fastapi import APIRouter, HTTPException

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.core.db_client import db_client

router = APIRouter()

@router.get("/status/{job_id}")
def get_status(job_id: str):
    """
    Retrieves the status of an analysis job.
    """
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = db_client.get_job(str(job_uuid))
    
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    result = None
    if job["status"] == "completed":
        result = db_client.get_results_by_job_id(str(job_uuid))
    elif job["status"] == "failed":
        result = {"error": "Analysis failed"}
    elif job["status"] == "TIMED_OUT":
        result = {"error": "Analysis timed out"}


    response = {
        "job_id": job_id,
        "status": job["status"],
        "result": result,
    }
    return response