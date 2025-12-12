from fastapi import APIRouter

router = APIRouter()

@router.get("/analyze")
def analyze_repo(repo: str):
    return {"message": f"Analyzing {repo}"}
