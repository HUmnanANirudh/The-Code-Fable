from collections import defaultdict
from fastapi import APIRouter
from app.core.db_client import db_client
from app.core.langchain_service import langchain_service
from app.core.github_client import github_client
import json

router = APIRouter()


def _count_files(tree: dict) -> int:
    if not isinstance(tree, dict) or not tree:
        return 0

    total = 0
    for value in tree.values():
        if isinstance(value, dict):
            total += _count_files(value)
        else:
            total += 1
    return total


def _build_language_distribution(languages: dict) -> list[dict]:
    total = sum(languages.values()) or 1
    ordered = sorted(languages.items(), key=lambda item: item[1], reverse=True)
    return [
        {
            "language": language,
            "bytes": bytes_count,
            "share": round((bytes_count / total) * 100, 2),
        }
        for language, bytes_count in ordered
    ]


def _extract_module_metrics(modules: dict) -> list[dict]:
    module_nodes = modules.get("nodes", []) if isinstance(modules, dict) else []
    ordered_nodes = sorted(
        module_nodes,
        key=lambda node: (node.get("data", {}).get("fan_in", 0) + node.get("data", {}).get("fan_out", 0)),
        reverse=True,
    )

    return [
        {
            "id": node.get("id"),
            "label": node.get("data", {}).get("label"),
            "files": node.get("data", {}).get("files", 0),
            "fan_in": node.get("data", {}).get("fan_in", 0),
            "fan_out": node.get("data", {}).get("fan_out", 0),
            "centrality": node.get("data", {}).get("centrality", 0),
        }
        for node in ordered_nodes
    ]

@router.get("/analytics/{repo_id}/health")
def get_health(repo_id: str):
    repo = db_client.get_repo_by_id(repo_id)
    if not repo:
        return {"status": "error", "health": None, "error": "Repository not found"}

    intelligence = repo.get("intelligence") or {}
    modules = repo.get("modules") or {}
    tree_viewer = repo.get("tree_viewer") or {}

    languages = {}
    try:
        languages = github_client.get_languages(repo.get("owner"), repo.get("name"))
    except Exception:
        languages = {language: 1 for language in intelligence.get("tech_stack", [])}

    health = {
        "file_count": _count_files(tree_viewer),
        "module_count": len(modules.get("nodes", [])) if isinstance(modules, dict) else 0,
        "tech_stack": intelligence.get("tech_stack", []),
        "language_distribution": _build_language_distribution(languages),
        "module_metrics": _extract_module_metrics(modules),
    }

    return {"status": "ok", "health": health, "metrics": repo.get("metrics") if repo else None}

@router.get("/analytics/{repo_id}/dead-code")
def get_dead_code(repo_id: str):
    prompt = "Find any potential dead code, unused functions, or deprecated methods in the codebase. Respond ONLY with a valid JSON array of objects with keys: 'file', 'line', 'description'. Do not use markdown blocks."
    try:
        result = langchain_service.generate_insight(repo_id, prompt)
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0]
        elif "```" in result:
            result = result.split("```")[1].split("```")[0]
        dead_code_data = json.loads(result.strip())
        return {"dead_code": dead_code_data}
    except Exception as e:
        return {"dead_code": [], "error": str(e)}

@router.get("/analytics/{repo_id}/architecture")
def get_architecture(repo_id: str):
    prompt = "Identify the core modules of this repository and how they depend on each other. Respond ONLY with a valid JSON object with keys 'nodes' (array of {id, label}) and 'edges' (array of {source, target}). Do not use markdown blocks."
    try:
        result = langchain_service.generate_insight(repo_id, prompt)
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0]
        elif "```" in result:
            result = result.split("```")[1].split("```")[0]
        architecture_data = json.loads(result.strip())
        return {"architecture": architecture_data}
    except Exception as e:
        return {"architecture": None, "error": str(e)}
