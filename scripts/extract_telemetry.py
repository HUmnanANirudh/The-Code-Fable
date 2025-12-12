import os
import sys
import json

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.core.github_client import GitHubClient
from backend.app.core.metrics import Metrics
from backend.app.core.graph_builder import GraphBuilder

def main():
    repo_name = os.getenv("GITHUB_REPOSITORY")
    if not repo_name:
        raise ValueError("GITHUB_REPOSITORY environment variable not set")
    owner, repo = repo_name.split("/")

    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise ValueError("GITHUB_TOKEN environment variable not set")

    github_client = GitHubClient(token)

    print("Fetching repository data...")
    commits = github_client.get_commits(owner, repo)
    file_tree = github_client.get_file_tree(owner, repo)

    print("Analyzing metrics...")
    metrics_analyzer = Metrics(file_tree)
    churn = metrics_analyzer.calculate_churn()
    hotspots = metrics_analyzer.identify_hotspots(churn)

    print("Building graph...")
    graph_builder = GraphBuilder(file_tree, churn)
    graph = graph_builder.build_synapse_graph()
    clusters = graph_builder.generate_clusters()

    telemetry_data = {
        "repo": {
            "owner": owner,
            "name": repo,
        },
        "graph": graph,
        "metrics": {
            "churn": churn,
            "hotspots": hotspots,
        },
        "clusters": clusters,
        "narrative": "This is a placeholder for the generated narrative.",
    }

    print("Writing telemetry.json...")
    with open("telemetry.json", "w") as f:
        json.dump(telemetry_data, f, indent=2)

    print("Telemetry data extracted successfully.")

if __name__ == "__main__":
    main()
