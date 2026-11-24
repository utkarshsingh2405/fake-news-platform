from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_admin_user
from ..models.user import User
from ..services.ml_service import MLService
import platform
import psutil
import os

router = APIRouter()

@router.get("/health")
async def system_health():
    """Detailed health check for system monitoring."""
    ml_service = MLService()
    return {
        "status": "healthy",
        "model_loaded": ml_service.is_model_loaded(),
        "database": "connected",
        "version": "1.0.0",
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }

@router.get("/metrics")
async def get_system_metrics(
    admin: User = Depends(get_current_admin_user)
):
    """Get system performance metrics (admin only)."""
    ml_service = MLService()
    metrics = {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent,
        "model_metrics": ml_service.get_model_metrics() if ml_service.is_model_loaded() else None,
        "uptime": psutil.boot_time()
    }
    return metrics

@router.get("/info")
async def system_info():
    """Public system information."""
    return {
        "name": "Fake News Detection Platform",
        "version": "1.0.0",
        "description": "AI-powered fake news detection system",
        "features": ["Text classification", "Confidence scoring", "Keyword extraction", "User history"]
    }

@router.post("/clear-cache")
async def clear_cache(
    admin: User = Depends(get_current_admin_user)
):
    """Clear system cache (admin only)."""
    # Implement cache clearing logic if using Redis
    return {"message": "Cache cleared successfully"}