from app.core.import_parser import ImportParser
import os
import sys
from celery import Celery

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings
from app.core.github_client import GitHubClient
from app.core.metrics import Metrics
from app.core.graph_builder import GraphBuilder
from app.core.narrative import Narrative
from app.core.llm_client import LLMClient
from app.core.db_client import db_client

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

from celery.exceptions import SoftTimeLimitExceeded

@celery_app.task(bind=True, soft_time_limit=300, time_limit=310)
def analyze_repository(self, owner: str, repo: str, repo_id: str):
    """
    A Celery task to analyze a GitHub repository.
    """
    print(f"Analyzing {owner}/{repo}")
    
    # Update job status to 'running'
    db_client.update_job_status(self.request.id, "running")

    try:
        # 1. Fetch data from GitHub
        github_client = GitHubClient()
        file_tree = github_client.get_file_tree(owner, repo)

        # 2. Parse imports to find dependencies
        import_parser = ImportParser(github_client)
        dependencies = import_parser.get_dependencies(owner, repo, file_tree)

        # 3. Calculate metrics
        metrics_analyzer = Metrics(file_tree)
        churn = metrics_analyzer.calculate_churn()
        hotspots = metrics_analyzer.identify_hotspots(churn)

        # 4. Build graph
        graph_builder = GraphBuilder(file_tree, churn, dependencies)
        graph = graph_builder.build_synapse_graph()
        clusters = graph_builder.generate_clusters()

        # 5. Generate narrative
        llm_client = LLMClient(api_key=settings.LLM_API_KEY)
        summary = {"hotspots": hotspots, "clusters": clusters}
        narrative_generator = Narrative(summary, llm_client)
        story = narrative_generator.generate_story()

        # 6. Store results in DB
        analysis_data = {
            "job_id": self.request.id,
            "graph": graph,
            "metrics": {
                "churn": churn,
                "hotspots": hotspots,
            },
            "clusters": clusters,
            "narrative": story,
        }
        db_client.store_analysis_result(repo_id, analysis_data)

        return {"status": "completed", "result": analysis_data}

    except SoftTimeLimitExceeded:
        db_client.update_job_status(self.request.id, "TIMED_OUT")
        print(f"Analysis timed out for {owner}/{repo}")
        raise
    except Exception as e:
        db_client.update_job_status(self.request.id, "failed")
        print(f"Analysis failed for {owner}/{repo}: {e}")
        # Optionally re-raise the exception if you want Celery to record it as a failure
        raise

# To run the worker:
# celery -A worker.worker.celery_app worker --loglevel=info