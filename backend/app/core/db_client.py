import uuid
import json
from datetime import datetime
from typing import Dict, Any, Optional
import redis

# In-memory storage to mock the database
# _repos: Dict[uuid.UUID, Dict[str, Any]] = {}
# _jobs: Dict[uuid.UUID, Dict[str, Any]] = {}

class DBClient:
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.redis_client = redis.from_url(self.db_url)

    def get_repo_by_name(self, owner: str, name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a repository by its owner and name.
        """
        repo_id = self.redis_client.get(f"repo:{owner}:{name}")
        if repo_id:
            repo_data = self.redis_client.get(f"repo_id:{repo_id.decode('utf-8')}")
            if repo_data:
                return json.loads(repo_data)
        return None

    def create_repo(self, owner: str, name: str, is_public: bool) -> Dict[str, Any]:
        """
        Creates a new repository entry.
        """
        repo_id = str(uuid.uuid4())
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
        self.redis_client.set(f"repo:{owner}:{name}", repo_id)
        self.redis_client.set(f"repo_id:{repo_id}", json.dumps(new_repo))
        return new_repo
    
    def create_job(self, repo_id: str) -> Dict[str, Any]:
        """
        Creates a new analysis job.
        """
        job_id = str(uuid.uuid4())
        new_job = {
            "id": job_id,
            "repo_id": repo_id,
            "status": "pending",
            "created_at": str(datetime.utcnow()),
            "updated_at": str(datetime.utcnow()),
        }
        self.redis_client.set(f"job:{job_id}", json.dumps(new_job))
        return new_job

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a job by its ID.
        """
        job_data = self.redis_client.get(f"job:{job_id}")
        if job_data:
            return json.loads(job_data)
        return None

    def update_job_status(self, job_id: str, status: str) -> Optional[Dict[str, Any]]:
        """
        Updates the status of a job.
        """
        job_data = self.get_job(job_id)
        if job_data:
            job_data['status'] = status
            job_data['updated_at'] = str(datetime.utcnow())
            self.redis_client.set(f"job:{job_id}", json.dumps(job_data))
            return job_data
        return None

    def store_analysis_result(self, repo_id: str, analysis_data: Dict[str, Any]):
        """
        Stores the final analysis result for a repository.
        """
        repo_data_str = self.redis_client.get(f"repo_id:{repo_id}")
        if repo_data_str:
            repo_data = json.loads(repo_data_str)
            repo_data.update({
                "last_analyzed": str(datetime.utcnow()),
                "graph": analysis_data.get("graph"),
                "metrics": analysis_data.get("metrics"),
                "narrative": analysis_data.get("narrative"),
                "clusters": analysis_data.get("clusters"),
            })
            self.redis_client.set(f"repo_id:{repo_id}", json.dumps(repo_data))
            job_id = analysis_data.get("job_id")
            if job_id:
                self.update_job_status(job_id, "completed")
            return repo_data
        return None

    def get_results_by_job_id(self, job_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Retrieves the analysis results for a given job ID.
        """
        job = self.get_job(job_id)
        if job:
            repo_id = job.get("repo_id")
            if repo_id:
                repo_data = self.redis_client.get(f"repo_id:{repo_id}")
                if repo_data:
                    return json.loads(repo_data)
        return None

# Instantiate a single client for the app to use
db_client = DBClient(db_url="redis://localhost:6379/0")