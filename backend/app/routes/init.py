"""
API routes module.
"""
from .auth import router as auth_router
from .prediction import router as prediction_router
from .admin import router as admin_router
from .system import router as system_router