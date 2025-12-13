from .copilot_client import CopilotClient

class Narrative:
    def __init__(self, summary: dict, copilot_client: CopilotClient):
        self.summary = summary
        self.copilot_client = copilot_client

    def generate_story(self):
        # This is a placeholder for generating the repository narrative
        prompt = self._format_prompt()
        story = self.copilot_client.generate(prompt)
        return story

    def _format_prompt(self):
        """
        Formats a detailed prompt for the Copilot client to generate a repository narrative.
        """
        prompt = (
            "You are a principal software engineer tasked with analyzing a new codebase. "
            "Based on the following summary, write a brief, insightful narrative (2-3 paragraphs) about the repository's architecture, potential risks, and areas of interest. "
            "Your tone should be technical, objective, and slightly informal, like you're talking to your team.\n\n"
            "**Codebase Analysis Summary:**\n"
            "- **Identified Hotspots (Top 10 most active files):**\n"
        )

        for hotspot in self.summary.get('hotspots', []):
            prompt += f"  - `{hotspot}`\n"

        prompt += "\n- **Key Architectural Clusters (by directory):**\n"
        for cluster, files in self.summary.get('clusters', {}).items():
            prompt += f"  - **Cluster:** `{cluster}` ({len(files)} files)\n"
        
        prompt += (
            "\n**Your Task:**\n"
            "1.  **Synthesize:** Briefly describe the likely purpose and structure of the application based on the clusters.\n"
            "2.  **Analyze Hotspots:** What do the hotspots suggest about recent development activity or potential complexity?\n"
            "3.  **Identify Risks:** Are there any potential risks or code smells suggested by the file names or groupings (e.g., large, monolithic clusters)?\n"
            "4.  **Suggest Next Steps:** What would you investigate next?\n\n"
            "Generate the narrative now."
        )
        return prompt
