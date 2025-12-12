class CopilotClient:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def generate(self, prompt: str):
        # This is a mock response from the Copilot API
        return "This is a story about a repository that is very interesting."
