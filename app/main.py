"""
FastAPI Application
Main entry point for the E-commerce Support AI API
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.errors import register_exception_handlers
from app.core.security import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Import routes
from app.api.routes import health, chat

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler
    Runs on startup and shutdown
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Using local mode: {settings.USE_LOCAL_MODE}")
    
    # Initialize vector store if needed
    try:
        from app.services.rag.vector_store import initialize_vector_store_if_needed
        logger.info("Checking vector store initialization...")
        initialize_vector_store_if_needed()
        logger.info("Vector store ready")
    except Exception as e:
        logger.warning(f"Vector store initialization skipped: {e}")
        logger.info("Vector store will initialize on first query")
    
    # Initialize agent (lazy loading)
    try:
        from app.services.langchain.agent import get_support_agent
        logger.info("Initializing support agent...")
        get_support_agent()
        logger.info("Support agent ready")
    except Exception as e:
        logger.error(f"Failed to initialize agent: {e}")
    
    logger.info(f"{settings.APP_NAME} started successfully")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered customer support for e-commerce",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
register_exception_handlers(app)

# Register routes
app.include_router(health.router, tags=["Health"])
app.include_router(
    chat.router,
    prefix="/api",
    tags=["Chat"]
)

# Log registered routes
logger.info("Registered routes:")
for route in app.routes:
    if hasattr(route, 'methods'):
        logger.info(f"  {list(route.methods)[0]} {route.path}")


# Development server
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )