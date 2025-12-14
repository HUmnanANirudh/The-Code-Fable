import os
import re
from typing import List, Dict, Any
from .github_client import GitHubClient

class ImportParser:
    def __init__(self, github_client: GitHubClient):
        self.github_client = github_client

    def get_dependencies(self, owner: str, repo: str, file_tree: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Parses the imports for each file in the file tree and returns a list of dependencies.
        """
        dependencies = []
        files = [item['path'] for item in file_tree if item['type'] == 'blob']
        file_set = set(files)

        for file_path in files:
            try:
                content = self.github_client.get_file_content(owner, repo, file_path)
                imports = self._parse_imports(file_path, content)
                for imp in imports:
                    # Resolve relative imports
                    if imp.startswith('.'):
                        base_dir = os.path.dirname(file_path)
                        resolved_import = os.path.normpath(os.path.join(base_dir, imp))
                    else:
                        resolved_import = imp
                    
                    # Find the target file in the file tree
                    target_file = None
                    possible_targets = [
                        f"{resolved_import}.py",
                        f"{resolved_import}.js",
                        f"{resolved_import}.jsx",
                        f"{resolved_import}.ts",
                        f"{resolved_import}.tsx",
                        f"{resolved_import}/__init__.py",
                        resolved_import
                    ]
                    
                    for target in possible_targets:
                        if target in file_set:
                            target_file = target
                            break
                    
                    if target_file:
                        dependencies.append({"source": file_path, "target": target_file})

            except Exception as e:
                print(f"Error parsing imports for {file_path}: {e}")

        return dependencies

    def _parse_imports(self, file_path: str, content: str) -> List[str]:
        """
        Parses the import statements from the content of a file.
        """
        if file_path.endswith('.py'):
            return self._parse_python_imports(content)
        elif file_path.endswith(('.js', '.jsx', '.ts', '.tsx')):
            return self._parse_js_imports(content)
        return []

    def _parse_python_imports(self, content: str) -> List[str]:
        """
        Parses imports from a Python file.
        """
        imports = []
        # Improved regex for `from . import`, `from .module import`, `import .module`
        regex = r"^\s*(?:from\s+([\.\w*]+)\s+import\s+([\w\s,()*]+)|import\s+([\.\w, ]+))"
        for line in content.splitlines():
            match = re.match(regex, line)
            if match:
                module = match.group(1) or match.group(3)
                if module:
                    # Handle multiple modules in one import statement, e.g., "import os, sys"
                    modules = [m.strip().replace('.', '/') for m in module.split(',')]
                    imports.extend(modules)
        return imports

    def _parse_js_imports(self, content: str) -> List[str]:
        """
        Parses imports from a JavaScript/TypeScript file.
        """
        imports = []
        # Regex for `import ... from '...'`, `import '...'`, and dynamic `import('...')`
        regex = r"import\s+(?:(?:\*\s+as\s+\w+)|(?:\{[^}]+\})|\w+)\s+from\s+['\"]([^'\"]+)['\"]|import\s+['\"]([^'\"]+)['\"]|import\((['\"])(.*?)\3\)"
        for match in re.finditer(regex, content):
            module = match.group(1) or match.group(2) or match.group(4)
            if module:
                imports.append(module)
        return imports
