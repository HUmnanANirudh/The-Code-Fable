import os
from typing import List, Dict, Any

IGNORE_DIRS = [
    'node_modules/',
    'public/',
    'venv/',
    '__pycache__/',
    '.git/',
    'dist/',
    'build/',
]
IGNORE_FILES = [
    '.gitignore',
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'requirements.txt',
]

class GraphBuilder:
    def __init__(self, file_tree: List[Dict[str, Any]], churn_data: Dict[str, int], dependencies: List[Dict[str, str]]):
        self.file_tree = file_tree
        self.churn_data = churn_data
        self.dependencies = dependencies
        self.nodes = []
        self.edges = []
        self.clusters = {}

    def _is_ignored(self, path: str) -> bool:
        if any(path.startswith(d) for d in IGNORE_DIRS):
            return True
        if os.path.basename(path) in IGNORE_FILES:
            return True
        return False

    def build_synapse_graph(self) -> Dict[str, List]:
        """
        Builds a dependency graph from the file tree, churn data, and dependencies.
        Nodes represent files, and edges represent dependencies between files.
        """
        files = [item for item in self.file_tree if item['type'] == 'blob' and not self._is_ignored(item['path'])]
        node_ids = {item['path'] for item in files}

        # Create nodes for all files
        for file_path in node_ids:
            churn = self.churn_data.get(file_path, 0)
            self.nodes.append({
                "id": file_path,
                "group": os.path.dirname(file_path),
                "size": churn,  # Use churn to determine node size
            })

        # Create edges based on dependencies
        for dep in self.dependencies:
            source = dep['source']
            target = dep['target']
            if source in node_ids and target in node_ids:
                self.edges.append({
                    "source": source,
                    "target": target,
                })

        return {"nodes": self.nodes, "links": self.edges}

    def generate_clusters(self) -> Dict[str, List[str]]:
        """
        Generates clusters of files based on their parent directory.
        """
        for node in self.nodes:
            dir_name = os.path.dirname(node['id'])
            if dir_name not in self.clusters:
                self.clusters[dir_name] = []
            self.clusters[dir_name].append(node['id'])
        
        return self.clusters