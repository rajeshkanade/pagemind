from pydantic import BaseModel, HttpUrl
from typing import List, Optional


class Link(BaseModel):
    text: Optional[str]
    href: Optional[str]


class Image(BaseModel):
    alt: Optional[str]
    src: Optional[str]


class SummarizeRequest(BaseModel):
    url: Optional[HttpUrl]
    title: Optional[str]
    text: Optional[str]
    html: Optional[str]
    innerText: Optional[str]
    outerHTML: Optional[str]
    links: Optional[List[Link]] = []
    images: Optional[List[Image]] = []
    
class SummarizeResponse(BaseModel):
    summary: str
    message: Optional[str] = None
    
class AskRequest(BaseModel):
    question: str
    url: Optional[HttpUrl]
    title: Optional[str]
    text: Optional[str]
    html: Optional[str]

class AskResponse(BaseModel):
    answer: str
    message: Optional[str] = None