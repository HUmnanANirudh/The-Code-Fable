import os
from typing import List, Dict, Any

class GraphBuilder:
    def __init__(self, file_tree: List[Dict[str, Any]], churn_data: Dict[str, int]):
        self.file_tree = file_tree
        self.churn_data = churn_data
        self.nodes = []
        self.edges = []
        self.clusters = {}

    def build_synapse_graph(self) -> Dict[str, List]:
        """
        Builds a synapse graph from the file tree and churn data.
        Nodes represent files, and edges represent directory relationships.
        """
        files = [item for item in self.file_tree if item['type'] == 'blob']
        
        # Create nodes for each file
        for file_item in files:
            file_path = file_item['path']
            churn = self.churn_data.get(file_path, 0)
            self.nodes.append({
                "id": file_path,
                "group": os.path.dirname(file_path),
                "size": churn,  # Use churn to determine node size
            })

        # Create edges based on directory structure
        path_map = {node['id']: node for node in self.nodes}
        for node in self.nodes:
            dir_name = os.path.dirname(node['id'])
            # Find other files in the same directory and create edges
            for other_node in self.nodes:
                if node['id'] != other_node['id'] and os.path.dirname(other_node['id']) == dir_name:
                    self.edges.append({
                        "source": node['id'],
                        "target": other_node['id'],
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