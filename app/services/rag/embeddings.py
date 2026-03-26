"""
Embeddings Service - Google Gemini
"""
import os
from dotenv import load_dotenv
load_dotenv()
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.logging import get_logger

logger = get_logger(__name__)

def get_embeddings():
    """Get Gemini embeddings - FREE, no quota issues"""
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )
    logger.info("Initialized Google Gemini embeddings")
    return embeddings

__all__ = ['get_embeddings']