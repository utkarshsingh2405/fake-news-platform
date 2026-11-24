from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime

from .config import settings
from .database import init_db
from .models import User, Prediction, AuditLog  # Ensure models are registered with Base before init_db
from .middleware.logging_middleware import LoggingMiddleware
from .dependencies import get_current_user, get_current_active_user, loose_rate_limiter
from .routes import auth, prediction, admin, system

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.log_file),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI-Powered Fake News Detection Platform",
    version="1.0.0",
    docs_url="/api/docs" if settings.app_debug else None,
    redoc_url="/api/redoc" if settings.app_debug else None,
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware in production
if settings.is_production():
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configure as needed
    )

# Add custom logging middleware
app.add_middleware(LoggingMiddleware)

# Health check endpoint (no rate limit)
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.app_env,
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "description": "AI-Powered Fake News Detection Platform",
        "docs": "/api/docs" if settings.app_debug else None,
        "status": "operational"
    }

# Protected test endpoint
@app.get("/api/protected", tags=["System"])
async def protected_route(user=Depends(get_current_active_user)):
    """Test endpoint to verify authentication."""
    return {
        "message": f"Hello {user.username}, you are authenticated!",
        "user_id": user.id,
        "email": user.email,
        "is_admin": user.is_admin
    }

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(prediction.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(system.router, prefix="/api/system", tags=["System"])

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database tables and create admin user on startup."""
    logger.info("Starting up Fake News Detection Platform...")
    
    # Initialize database tables
    init_db()
    logger.info("Database initialized")
    
    # Create default admin user if not exists
    from .services.auth_service import AuthService
    from .database import SessionLocal
    
    db = SessionLocal()
    try:
        auth_service = AuthService(db)
        admin = auth_service.get_user_by_email(settings.admin_email)
        if not admin:
            auth_service.create_admin_user(
                email=settings.admin_email,
                password=settings.admin_password,
                username="admin"
            )
            logger.info(f"Default admin user created: {settings.admin_email}")
        else:
            logger.info("Admin user already exists")
    except Exception as e:
        logger.error(f"Error creating admin user: {str(e)}")
    finally:
        db.close()
    
    # Load ML model (lazy loading in ml_service)
    logger.info("Startup complete")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down Fake News Detection Platform...")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "error_type": type(exc).__name__
        }
    )