from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
def get_status(id: str):
    return {"job_id": id, "status": "completed"}
