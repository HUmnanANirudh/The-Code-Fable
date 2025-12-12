from fastapi import APIRouter

router = APIRouter()

@router.get("/results")
def get_results(id: str):
    return {"job_id": id, "results": "This is where the results will be."}
