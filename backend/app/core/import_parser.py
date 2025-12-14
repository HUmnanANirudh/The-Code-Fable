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
                    candidates = []
                    
                    if imp.startswith('.'):
                        base_dir = os.path.dirname(file_path)
                        resolved = os.path.normpath(os.path.join(base_dir, imp))
                        candidates.append(resolved)
                    elif imp.startswith('@/'):
                        # Try common alias mappings
                        candidates.append(imp.replace('@/', 'src/'))
                        candidates.append(imp.replace('@/', 'frontend/src/'))
                        candidates.append(imp.replace('@/', 'backend/src/'))
                    else:
                        candidates.append(imp)
                    
                    # Find the target file in the file tree
                    target_file = None
                    
                    for candidate in candidates:
                        possible_targets = [
                            f"{candidate}.py",
                            f"{candidate}.js",
                            f"{candidate}.jsx",
                            f"{candidate}.ts",
                            f"{candidate}.tsx",
                            f"{candidate}/__init__.py",
                            f"{candidate}/index.js",
                            f"{candidate}/index.ts",
                            f"{candidate}/index.tsx",
                            candidate # For direct matches (e.g., dir/file without extension)
                        ]
                        
                        for target in possible_targets:
                            if target in file_set:
                                target_file = target
                                break
                        
                        if target_file:
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
                    # Handle multiple modules in one import statement
                    # And handle relative imports correctly
                    raw_modules = [m.strip() for m in module.split(',')]
                    
                    for m in raw_modules:
                        if m.startswith('.'):
                            # Count leading dots
                            dots = 0
                            for char in m:
                                if char == '.':
                                    dots += 1
                                else:
                                    break
                            
                            remainder = m[dots:]
                            path_part = remainder.replace('.', '/')
                            
                            if dots == 1:
                                normalized = f"./{path_part}"
                            else:
                                normalized = "../" * (dots - 1) + path_part
                            
                            # Clean up trailing slashes if import was just dots (e.g. "from . import")
                            if normalized.endswith('/'):
                                normalized = normalized.rstrip('/')
                            
                            imports.append(normalized)
                        else:
                            # Absolute import
                            imports.append(m.replace('.', '/'))
                            
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
                if module.startswith('@/'):
                     # Basic alias handling: treat @/ as relative to a potential src directory
                     # We can't know for sure without tsconfig, but we can return it as is
                     # and let the resolver try to match it against 'src/' + remainder
                     imports.append(module)
                else:
                    imports.append(module)
        return imports
