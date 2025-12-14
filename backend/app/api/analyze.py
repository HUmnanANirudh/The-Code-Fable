import os
import sys
from fastapi import APIRouter, HTTPException
import requests
from app.core.github_client import github_client
from app.core.db_client import db_client
from worker.worker import analyze_repository

router = APIRouter()

@router.get("/analyze")
def analyze_repo(repo: str):
    """
    Analyzes a GitHub repository.
    """
    try:
        # 1. Validate and parse the repo string
        path_parts = repo.strip("/").split("/")
        if len(path_parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid repository format. Use 'owner/name'.")
        
        owner, repo_name = path_parts

        # 2. Check if the repository is public
        repo_info = github_client.get_repo(owner, repo_name)
        if repo_info.get("private"):
            raise HTTPException(status_code=403, detail="Repository is private")

        # 3. Check if the repository has been analyzed before
        existing_repo = db_client.get_repo_by_name(owner, repo_name)
        if existing_repo and existing_repo.get("last_analyzed"):
            return existing_repo

        # 4. If not, create a new repository entry and analysis job
        if not existing_repo:
            existing_repo = db_client.create_repo(owner, repo_name, not repo_info.get("private"))

        job = db_client.create_job(existing_repo["id"])
        
        # 5. Trigger the Celery task
        task = analyze_repository.apply_async(args=[owner, repo_name, existing_repo["id"]], task_id=str(job["id"]))

        return {"message": "Analysis started", "job_id": job["id"], "repo_id": existing_repo["id"]}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=404, detail=f"Repository not found or GitHub API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))