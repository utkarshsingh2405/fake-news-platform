from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os
from pathlib import Path
from dotenv import load_dotenv

# Build absolute path to .env file (backend/.env)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

import logging
logger = logging.getLogger(__name__)

# Debug log whether .env file was found, without exposing secrets
logger.debug(f".env file exists at {env_path}: {env_path.exists()}")
if 'SECRET_KEY' in os.environ:
    logger.debug("SECRET_KEY from os.environ: ***set***")
else:
    logger.debug("SECRET_KEY from os.environ: ***missing***")

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "Fake News Detector"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    secret_key: str
    
    # Database
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 40
    
    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    
    # Admin
    admin_email: str
    admin_password: str
    
    # ML Model
    model_path: str = "./ml/models/best_model.joblib"
    vectorizer_path: str = "./ml/models/vectorizer.joblib"
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_period: int = 60
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "./logs/app.log"
    
    # File Upload
    max_upload_size: int = 10485760
    allowed_extensions: str = ".txt,.pdf,.docx"
    
    # External APIs
    news_api_key: Optional[str] = None
    
    # Redis
    redis_url: Optional[str] = None
    
    model_config = ConfigDict(
        env_file=".env",  # fallback, but we already loaded
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    def get_allowed_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.allowed_extensions.split(",")]
    
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"
    
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"

# Create global settings instance
settings = Settings()