from app.schema.analyze_schema import (
    AskRequest,
    AskResponse,
    SummarizeRequest,
    SummarizeResponse,
)


async def summarize_page(data: SummarizeRequest) -> SummarizeResponse:
    raise NotImplementedError("Implement summarize_page service logic here.")


async def ask_page(data: AskRequest) -> AskResponse:
    raise NotImplementedError("Implement ask_page service logic here.")
