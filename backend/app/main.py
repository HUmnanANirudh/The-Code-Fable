from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from app.api import health, analyze, status, results

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  
)

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health.router)
api_v1_router.include_router(analyze.router)
api_v1_router.include_router(status.router)
api_v1_router.include_router(results.router)

app.include_router(api_v1_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the internet"}
