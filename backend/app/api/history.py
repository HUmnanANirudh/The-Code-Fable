from fastapi import APIRouter, Depends
from app.core.db_client import db_client

router = APIRouter()

@router.get("/history")
async def get_analysis_history():
    """
    Returns a list of all analyzed repositories.
    """
    history = await db_client.get_analysis_history()
    return history
