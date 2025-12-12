import os
import sys
from fastapi import APIRouter, HTTPException
import uuid

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.core.db_client import db_client

router = APIRouter()

@router.get("/results/{job_id}")
def get_results(job_id: str):
    """
    Retrieves the results of a completed analysis job.
    """
    try:
        job_uuid = uuid.UUID(job_id)
        results = db_client.get_results_by_job_id(job_uuid)
        if not results:
            raise HTTPException(status_code=404, detail="Results not found for this job ID")
        return results
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))