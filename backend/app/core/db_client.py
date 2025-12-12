import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# In-memory storage to mock the database
_repos: Dict[uuid.UUID, Dict[str, Any]] = {}
_jobs: Dict[uuid.UUID, Dict[str, Any]] = {}

class DBClient:
    def __init__(self, db_url: str):
        self.db_url = db_url

    def get_repo_by_name(self, owner: str, name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a repository by its owner and name.
        """
        for repo in _repos.values():
            if repo['owner'] == owner and repo['name'] == name:
                return repo
        return None

    def create_repo(self, owner: str, name: str, is_public: bool) -> Dict[str, Any]:
        """
        Creates a new repository entry.
        """
        repo_id = uuid.uuid4()
        new_repo = {
            "id": repo_id,
            "owner": owner,
            "name": name,
            "is_public": is_public,
            "last_analyzed": None,
            "graph": None,
            "metrics": None,
            "narrative": None,
            "clusters": None,
        }
        _repos[repo_id] = new_repo
        return new_repo
    
    def create_job(self, repo_id: uuid.UUID) -> Dict[str, Any]:
        """
        Creates a new analysis job.
        """
        job_id = uuid.uuid4()
        new_job = {
            "id": job_id,
            "repo_id": repo_id,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        _jobs[job_id] = new_job
        return new_job

    def get_job(self, job_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Retrieves a job by its ID.
        """
        return _jobs.get(job_id)

    def update_job_status(self, job_id: uuid.UUID, status: str) -> Optional[Dict[str, Any]]:
        """
        Updates the status of a job.
        """
        if job_id in _jobs:
            _jobs[job_id]['status'] = status
            _jobs[job_id]['updated_at'] = datetime.utcnow()
            return _jobs[job_id]
        return None

    def store_analysis_result(self, repo_id: uuid.UUID, analysis_data: Dict[str, Any]):
        """
        Stores the final analysis result for a repository.
        """
        if repo_id in _repos:
            _repos[repo_id].update({
                "last_analyzed": datetime.utcnow(),
                "graph": analysis_data.get("graph"),
                "metrics": analysis_data.get("metrics"),
                "narrative": analysis_data.get("narrative"),
                "clusters": analysis_data.get("clusters"),
            })
            job_id = analysis_data.get("job_id")
            if job_id:
                self.update_job_status(job_id, "completed")
            return _repos[repo_id]
        return None

    def get_results_by_job_id(self, job_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Retrieves the analysis results for a given job ID.
        """
        job = self.get_job(job_id)
        if job:
            repo_id = job.get("repo_id")
            if repo_id:
                return _repos.get(repo_id)
        return None

# Instantiate a single client for the app to use
db_client = DBClient(db_url="mock_db_url")