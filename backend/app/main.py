from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

from app.api.v1.api import api_router 

app = FastAPI()

app.include_router(api_router, prefix="/api/v1")


