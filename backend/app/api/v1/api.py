from fastapi import APIRouter
from app.api.v1.routes import analyze

api_router = APIRouter()

api_router.include_router(analyze.router, prefix="/analyze", tags=["analyze"])



