from fastapi import APIRouter
from app.schema.analyze_schema import (
    SummarizeRequest,
    SummarizeResponse,
    AskRequest,
    AskResponse,
)
from app.services.analyze_service import ask_page, summarize_page

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Hello World"}

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(data: SummarizeRequest):
    return await summarize_page(data)


@router.post("/ask", response_model=AskResponse)
async def ask(data: AskRequest):
    return await ask_page(data)
