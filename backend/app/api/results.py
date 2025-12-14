import os
import sys
from fastapi import APIRouter, HTTPException
import uuid

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.core.db_client import db_client

router = APIRouter()

@router.get("/results/{repo_id}")
def get_results_by_repo_id(repo_id: str):
    """
    Retrieves the results of a completed analysis job by repo ID.
    """
    try:
        results = db_client.get_repo_by_id(repo_id)
        if not results:
            raise HTTPException(status_code=404, detail="Results not found for this repo ID")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))