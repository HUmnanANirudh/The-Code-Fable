import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings
from app.core.github_client import GitHubClient
from app.core.import_parser import ImportParser
from app.core.graph_builder import GraphBuilder
from app.core.narrative import Narrative
from app.core.llm_client import LLMClient
from app.core.db_client import db_client

def run_analysis(owner: str, repo: str, repo_id: str):
    """
    Synchronously analyzes a GitHub repository.
    """
    print(f"Analyzing {owner}/{repo}")

    github_client = GitHubClient()
    file_tree = github_client.get_file_tree(owner, repo)

    repo_info = github_client.get_repo(owner, repo)
    stars = repo_info.get("stargazers_count", 0)
    languages = github_client.get_languages(owner, repo)
    contributors = github_client.get_contributors(owner, repo)
    commits = github_client.get_commits(owner, repo, per_page=100, max_chunks=5)
    pull_requests = github_client.get_pull_requests(owner, repo, per_page=100, max_chunks=3)

    merged_prs = [pr for pr in pull_requests if pr.get("merged_at")]
    open_prs = [pr for pr in pull_requests if pr.get("state") == "open"]

    intelligence = {
        "repo_name": f"{owner}/{repo}",
        "stars": stars,
        "contributors": len(contributors),
        "recent_commits": len(commits),
        "tech_stack": list(languages.keys()),
        "total_prs": len(pull_requests),
        "merged_prs": len(merged_prs),
        "open_prs": len(open_prs),
    }

    # Build directory tree viewer
    def build_tree(items):
        tree = {}
        for item in items:
            path = item['path']
            parts = path.split('/')
            current = tree
            for index, part in enumerate(parts):
                is_last_part = index == len(parts) - 1
                if is_last_part and item['type'] == 'blob':
                    current[part] = None
                else:
                    current = current.setdefault(part, {})
        return tree

    tree_viewer = build_tree(file_tree)

    # Parse imports to find dependencies
    import_parser = ImportParser(github_client)
    dependencies = import_parser.get_dependencies(owner, repo, file_tree)

    # Build graph and module diagram
    graph_builder = GraphBuilder(file_tree, {}, dependencies)
    graph = graph_builder.build_synapse_graph()
    clusters = graph_builder.generate_clusters()
    modules = graph_builder.build_module_diagram()

    # Generate narrative, architecture summary, and agent prompt
    llm_client = LLMClient(api_key=settings.LLM_API_KEY)
    summary = {"hotspots": [], "clusters": clusters, "tech_stack": list(languages.keys())}
    narrative_generator = Narrative(summary, llm_client)
    story = narrative_generator.generate_what_it_is()
    how_it_works = narrative_generator.generate_how_it_works()
    rebuild_prompt = narrative_generator.generate_rebuild_prompt(intelligence, tree_viewer)

    # Store results in DB
    analysis_data = {
        "graph": graph,
        "metrics": {
            "hotspots": [],
        },
        "clusters": clusters,
        "modules": modules,
        "narrative": story,
        "how_it_works": how_it_works,
        "intelligence": intelligence,
        "tree_viewer": tree_viewer,
        "rebuild_prompt": rebuild_prompt,
    }
    db_client.store_analysis_result(repo_id, analysis_data)
    return analysis_data
