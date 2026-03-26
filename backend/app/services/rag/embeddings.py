"""
Embeddings Service
Provides embeddings for vector storage
"""
import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.logging import get_logger

logger = get_logger(__name__)


def get_embeddings():
    """
    Get embeddings model
    
    Returns:
        Embeddings model instance
    """
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )
        logger.info("Initialized Google Gemini embeddings")
        return embeddings
    except Exception as e:
        logger.error(f"Failed to initialize embeddings: {e}")
        raise


# Export for convenience
__all__ = ['get_embeddings']
