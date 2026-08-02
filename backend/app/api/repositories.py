from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.core.db_client import db_client
from app.core.github_client import github_client
from worker.worker import run_analysis

router = APIRouter()

class RepoRequest(BaseModel):
    repo: str

@router.post("/repositories")
def add_repository(req: RepoRequest, background_tasks: BackgroundTasks):
    path_parts = req.repo.strip("/").split("/")
    if len(path_parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid repository format. Use 'owner/name'.")
    owner, repo_name = path_parts
    
    existing_repo = db_client.get_repo_by_name(owner, repo_name)
    if existing_repo and existing_repo.get("last_analyzed"):
        return existing_repo

    repo_info = github_client.get_repo(owner, repo_name)
    if existing_repo:
        background_tasks.add_task(run_analysis, owner, repo_name, existing_repo["id"])
        return existing_repo

    new_repo = db_client.create_repo(
        owner,
        repo_name,
        not repo_info.get("private"),
        repo_info,
    )

    background_tasks.add_task(run_analysis, owner, repo_name, new_repo["id"])
    return new_repo

@router.get("/repositories")
def list_repositories():
    return db_client.get_analysis_history()

@router.get("/repositories/{repo_id}")
def get_repository(repo_id: str):
    repo = db_client.get_repo_by_id(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo

@router.delete("/repositories/{repo_id}")
def delete_repository(repo_id: str):
    return {"message": "Not implemented"}

@router.post("/repositories/{repo_id}/reindex")
def reindex_repository(repo_id: str, background_tasks: BackgroundTasks):
    repo = db_client.get_repo_by_id(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    background_tasks.add_task(run_analysis, repo["owner"], repo["name"], repo_id)
    return {"message": "Re-indexing started"}
