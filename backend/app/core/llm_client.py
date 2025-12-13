import os
import sys
from openai import OpenAI

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import settings

class LLMClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=settings.DEEPSEEK_API_BASE,
        )

    def generate(self, prompt: str):
        """
        Generates a narrative using the DeepSeek API.
        """
        system_prompt = (
            "You are a principal software engineer, a master of software architecture and design patterns. "
            "You have been tasked with providing a high-level analysis of a new codebase. "
            "Your analysis should be presented as a 'code fable' - a short, insightful story that helps engineers understand the repository's structure, "
            "potential challenges, and key areas of interest. The tone should be technical, objective, and engaging."
        )

        try:
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Based on the following analysis summary, write a code fable for the repository:\n\n{prompt}"},
                ],
                max_tokens=1024,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating narrative: {e}")
            return "There was an error generating the narrative."
