from fastapi import FastAPI
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
api_router = app.include_router(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(analyze.router)
api_router.include_router(status.router)
api_router.include_router(results.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the internet"}
