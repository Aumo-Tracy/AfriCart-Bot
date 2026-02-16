"""
Application Configuration Management
Handles environment variables and settings with Pydantic
"""
from typing import Optional, List, ClassVar, Dict
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Application
    APP_NAME: str = "ECommerce Support AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # API Keys
    OPENAI_API_KEY: str
    
    # Supabase (Optional)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Pinecone (Optional)
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_ENVIRONMENT: Optional[str] = None
    PINECONE_INDEX_NAME: str = "ecommerce-support"
    
    # Mode Configuration
    USE_LOCAL_MODE: bool = True
    USE_LOCAL_VECTORS: bool = True
    
    # LangChain
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: Optional[str] = None
    
    # Model Configuration
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    MAX_TOKENS: int = 500
    TEMPERATURE: float = 0.7
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 10
    RATE_LIMIT_PER_HOUR: int = 100
    
    # Security
    SECRET_KEY: str
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    
    # Token Cost Tracking
    TRACK_TOKEN_USAGE: bool = True
    
    # Vector Store Configuration
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 100
    SIMILARITY_TOP_K: int = 5
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def use_supabase(self) -> bool:
        """Check if Supabase is configured"""
        return bool(self.SUPABASE_URL and self.SUPABASE_KEY)
    
    @property
    def use_pinecone(self) -> bool:
        """Check if Pinecone is configured"""
        return bool(self.PINECONE_API_KEY and not self.USE_LOCAL_VECTORS)
    
    # Token pricing (USD per 1K tokens)
TOKEN_PRICING: ClassVar[Dict[str, Dict[str, float]]] = {
    "gpt-3.5-turbo": {
        "input": 0.0005,   # $0.50 per 1M tokens
        "output": 0.0015,  # $1.50 per 1M tokens
    },
    "gpt-4": {
        "input": 0.03,
        "output": 0.06,
    },
    "text-embedding-3-small": {
        "input": 0.00002,  # $0.02 per 1M tokens
    }
}
def calculate_cost(self, model: str, input_tokens: int, output_tokens: int = 0) -> float:
        """Calculate API cost for given token usage"""
        if model not in self.TOKEN_PRICING:
            return 0.0
        
        pricing = self.TOKEN_PRICING[model]
        input_cost = (input_tokens / 1000) * pricing.get("input", 0)
        output_cost = (output_tokens / 1000) * pricing.get("output", 0)
        
        return input_cost + output_cost


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Export for easy import
settings = get_settings()