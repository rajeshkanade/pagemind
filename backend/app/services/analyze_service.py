from app.schema.analyze_schema import (
    AskRequest,
    AskResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from app.utils.llm import SimpleLLMService


def _page_key(url, title: str | None = None) -> str:
    if url:
        return str(url)
    if title:
        return f"title:{title.strip().lower()}"
    return "page:unknown"


async def summarize_page(data: SummarizeRequest) -> SummarizeResponse:
    llm_service = SimpleLLMService()
    summary = llm_service.summarize(
        data.text or "",
        page_key=_page_key(data.url, data.title),
    )
    return SummarizeResponse(summary=summary)
    


async def ask_page(data: AskRequest) -> AskResponse:
    llm_service = SimpleLLMService()
    answer = llm_service.ask(
        data.question,
        page_key=_page_key(data.url, data.title),
        page_text=data.text or "",
    )
    return AskResponse(answer=answer)
