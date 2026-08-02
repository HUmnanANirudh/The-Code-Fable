from collections import defaultdict
from fastapi import APIRouter
from app.core.db_client import db_client
from app.core.langchain_service import langchain_service
from app.core.github_client import github_client
from pathlib import Path
import json
import re

router = APIRouter()

WORKSPACE_ROOT = Path(__file__).resolve().parents[3]


def _read_text_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def _parse_python_dependencies(text: str) -> list[dict]:
    dependencies = []
    in_block = False

    for raw_line in text.splitlines():
        line = raw_line.strip().rstrip(",")
        if line.startswith("dependencies = ["):
            in_block = True
            continue
        if in_block and line.startswith("]"):
            break
        if in_block and line.startswith('"') and line.endswith('"'):
            value = line.strip('"')
            dependencies.append({"name": value, "display": value})

    return dependencies


def _parse_package_dependencies(package_json_text: str) -> list[dict]:
    try:
        package_json = json.loads(package_json_text)
    except Exception:
        return []

    dependencies = []
    for name, version in (package_json.get("dependencies") or {}).items():
        dependencies.append({"name": name, "display": f"{name}@{version}"})
    for name, version in (package_json.get("devDependencies") or {}).items():
        dependencies.append({"name": name, "display": f"{name}@{version}"})
    return dependencies


def _parse_requirements_dependencies(text: str) -> list[dict]:
    dependencies = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("-"):
            continue
        dependencies.append({"name": line, "display": line})
    return dependencies


def _parse_pyproject_project_name(text: str) -> str:
    project_match = re.search(r'(?ms)^\s*name\s*=\s*["\']([^"\']+)["\']', text)
    if project_match:
        return project_match.group(1)
    poetry_match = re.search(r'(?ms)^\s*name\s*=\s*["\']([^"\']+)["\']', text)
    if poetry_match:
        return poetry_match.group(1)
    return "python-project"


def _manifest_group_label(path: Path) -> str:
    try:
        return str(path.parent.relative_to(WORKSPACE_ROOT)) or "."
    except Exception:
        return str(path.parent)


def _read_workspace_dependency_inventory() -> list[dict]:
    manifests: list[dict] = []
    seen_paths: set[str] = set()

    for manifest_path in sorted(WORKSPACE_ROOT.rglob("package.json")):
        if any(part in {"node_modules", "dist", "build", ".git"} for part in manifest_path.parts):
            continue
        text = _read_text_file(manifest_path)
        if not text:
            continue
        group_label = _manifest_group_label(manifest_path)
        try:
            package_json = json.loads(text)
            package_name = package_json.get("name") or group_label
        except Exception:
            package_name = group_label
        key = f"{group_label}:{manifest_path.name}"
        if key in seen_paths:
            continue
        seen_paths.add(key)
        manifests.append({
            "label": package_name,
            "path": str(manifest_path.relative_to(WORKSPACE_ROOT)),
            "kind": "package.json",
            "dependencies": _parse_package_dependencies(text),
        })

    for manifest_path in sorted(WORKSPACE_ROOT.rglob("pyproject.toml")):
        if any(part in {"node_modules", "dist", "build", ".git"} for part in manifest_path.parts):
            continue
        text = _read_text_file(manifest_path)
        if not text:
            continue
        key = f"{manifest_path.parent}:{manifest_path.name}"
        if key in seen_paths:
            continue
        seen_paths.add(key)
        manifests.append({
            "label": _parse_pyproject_project_name(text),
            "path": str(manifest_path.relative_to(WORKSPACE_ROOT)),
            "kind": "pyproject.toml",
            "dependencies": _parse_python_dependencies(text),
        })

    for manifest_path in sorted(WORKSPACE_ROOT.rglob("requirements.txt")):
        if any(part in {"node_modules", "dist", "build", ".git"} for part in manifest_path.parts):
            continue
        text = _read_text_file(manifest_path)
        if not text:
            continue
        key = f"{manifest_path.parent}:{manifest_path.name}"
        if key in seen_paths:
            continue
        seen_paths.add(key)
        manifests.append({
            "label": _manifest_group_label(manifest_path),
            "path": str(manifest_path.relative_to(WORKSPACE_ROOT)),
            "kind": "requirements.txt",
            "dependencies": _parse_requirements_dependencies(text),
        })

    return manifests


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


def _extract_dependency_metrics(graph: dict) -> dict:
    nodes = graph.get("nodes", []) if isinstance(graph, dict) else []
    links = graph.get("links", []) if isinstance(graph, dict) else []
    node_ids = {node.get("id") for node in nodes if isinstance(node, dict) and node.get("id")}

    incoming = defaultdict(int)
    outgoing = defaultdict(int)
    adjacency = defaultdict(set)
    dependency_rows = []

    for link in links:
        if not isinstance(link, dict):
            continue
        source = link.get("source")
        target = link.get("target")
        if not source or not target:
            continue
        if node_ids and (source not in node_ids or target not in node_ids):
            continue

        outgoing[source] += 1
        incoming[target] += 1
        adjacency[source].add(target)
        dependency_rows.append({
            "source": source,
            "target": target,
            "source_count": outgoing[source],
            "target_count": incoming[target],
        })

    top_files = sorted(
        [
            {
                "id": node.get("id"),
                "group": node.get("group"),
                "in_degree": incoming.get(node.get("id"), 0),
                "out_degree": outgoing.get(node.get("id"), 0),
                "degree": incoming.get(node.get("id"), 0) + outgoing.get(node.get("id"), 0),
            }
            for node in nodes
            if isinstance(node, dict) and node.get("id")
        ],
        key=lambda item: item["degree"],
        reverse=True,
    )

    return {
        "edge_count": len(dependency_rows),
        "top_files": top_files,
        "dependencies": dependency_rows,
    }


def _summarize_code_splitting(repo: dict, dependency_metrics: dict) -> dict:
    graph = repo.get("graph") or {}
    nodes = graph.get("nodes", []) if isinstance(graph, dict) else []
    links = graph.get("links", []) if isinstance(graph, dict) else []

    def _bucket(path: str) -> str:
        if not path:
          return "unknown"
        if "/" in path:
            return path.split("/")[0]
        return path

    top_level_counts = defaultdict(int)
    cross_boundary_edges = 0
    for node in nodes:
        if isinstance(node, dict) and node.get("id"):
            top_level_counts[_bucket(str(node.get("id")))] += 1

    for link in links:
        if not isinstance(link, dict):
            continue
        source_bucket = _bucket(str(link.get("source") or ""))
        target_bucket = _bucket(str(link.get("target") or ""))
        if source_bucket != target_bucket:
            cross_boundary_edges += 1

    total_edges = max(len(dependency_metrics.get("dependencies") or []), len(links))
    top_degree = (dependency_metrics.get("top_files") or [])[:5]
    top_degree_total = sum(item.get("degree", 0) for item in top_degree)
    all_degree_total = sum(item.get("degree", 0) for item in dependency_metrics.get("top_files") or []) or 1
    concentration_ratio = round(top_degree_total / all_degree_total, 2)
    cross_ratio = round(cross_boundary_edges / total_edges, 2) if total_edges else 0

    score = 100
    score -= min(45, int(cross_ratio * 100 * 0.5))
    score -= min(35, int(concentration_ratio * 100 * 0.35))
    score = max(0, min(100, score))

    if score >= 75:
        verdict = "Good"
    elif score >= 45:
        verdict = "Mixed"
    else:
        verdict = "Needs work"

    return {
        "score": score,
        "verdict": verdict,
        "cross_boundary_edges": cross_boundary_edges,
        "cross_boundary_ratio": cross_ratio,
        "concentration_ratio": concentration_ratio,
        "top_level_groups": sorted(top_level_counts.items(), key=lambda item: item[1], reverse=True),
    }

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
        "dependency_metrics": _extract_dependency_metrics(repo.get("graph") or {}),
        "workspace_dependencies": _read_workspace_dependency_inventory(),
        "code_splitting": _summarize_code_splitting(repo, _extract_dependency_metrics(repo.get("graph") or {})),
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
