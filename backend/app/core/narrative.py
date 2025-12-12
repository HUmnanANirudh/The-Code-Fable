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
        # This is a placeholder for formatting the prompt for Copilot
        return "Tell me a story about this repository."
