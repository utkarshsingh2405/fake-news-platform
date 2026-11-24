"""
Fake News Detection Platform - Backend Application
"""
__version__ = "1.0.0"
__author__ = "Fake News Detection Team"

from fastapi import FastAPI
from .config import settings
from .database import engine, Base

def create_app() -> FastAPI:
    """Application factory for creating FastAPI instance."""
    from .main import app
    return app