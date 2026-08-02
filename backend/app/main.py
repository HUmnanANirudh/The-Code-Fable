from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from app.api import repositories, search, analytics, generate, health

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174","http://localhost:3000"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

api_router.include_router(repositories.router)
api_router.include_router(search.router)
api_router.include_router(analytics.router)
api_router.include_router(generate.router)

app.include_router(api_router)
app.include_router(health.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to the internet"}
