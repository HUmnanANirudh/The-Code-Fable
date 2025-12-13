import os
import sys
import google.generativeai as genai

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import settings

class LLMClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=self.api_key)

    def generate(self, prompt: str):
        """
        Generates a narrative using the Gemini API.
        """
        system_prompt = (
            "You are a principal software engineer, a master of software architecture and design patterns. "
            "You have been tasked with providing a high-level analysis of a new codebase. "
            "Your analysis should be presented as a 'code fable' - a short, insightful story that helps engineers understand the repository's structure, "
            "potential challenges, and key areas of interest. The tone should be technical, objective, and engaging.\n\n"
            "Based on the following analysis summary, write a code fable for the repository:\n\n"
        )
        full_prompt = system_prompt + prompt

        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Error generating narrative: {e}")
            return "There was an error generating the narrative."
