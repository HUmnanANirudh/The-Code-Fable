import os
import sys
import requests
from typing import List, Dict, Any

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import settings

class GitHubClient:
    def __init__(self, token: str = settings.GITHUB_TOKEN):
        self.token = token
        self.headers = {"Authorization": f"token {self.token}"}
        self.api_url = "https://api.github.com"

    def get_repo(self, owner: str, repo: str) -> Dict[str, Any]:
        """
        Retrieves repository information.
        """
        url = f"{self.api_url}/repos/{owner}/{repo}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_commits(self, owner: str, repo: str, per_page: int = 100, max_chunks: int = 10) -> List[Dict[str, Any]]:
        """
        Fetches commits for a repository with pagination.
        """
        url = f"{self.api_url}/repos/{owner}/{repo}/commits"
        commits = []
        for page in range(1, max_chunks + 1):
            params = {"per_page": per_page, "page": page}
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            if not data:
                break
            commits.extend(data)
        return commits

    def get_pull_requests(self, owner: str, repo: str, per_page: int = 100, max_chunks: int = 4) -> List[Dict[str, Any]]:
        """
        Fetches pull requests for a repository with pagination.
        """
        url = f"{self.api_url}/repos/{owner}/{repo}/pulls"
        pull_requests = []
        for page in range(1, max_chunks + 1):
            params = {"per_page": per_page, "page": page, "state": "all"}
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            if not data:
                break
            pull_requests.extend(data)
        return pull_requests

    def get_file_tree(self, owner: str, repo: str, branch: str = "main") -> List[Dict[str, Any]]:
        """
        Fetches the file tree for a repository branch.
        """
        url = f"{self.api_url}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        data = response.json()
        return data.get("tree", [])

github_client = GitHubClient()