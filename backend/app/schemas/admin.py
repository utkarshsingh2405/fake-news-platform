from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime
    last_login: Optional[datetime]
    predictions_count: Optional[int] = 0

class AdminAnalyticsResponse(BaseModel):
    total_users: int
    active_users_last_30d: int
    total_predictions: int
    fake_predictions_count: int
    real_predictions_count: int
    average_confidence: float
    predictions_by_day: List[Dict[str, Any]]
    model_accuracy: Optional[float]
    recent_activity: List[Dict[str, Any]]

class RetrainRequest(BaseModel):
    dataset_url: Optional[str] = None
    use_default_dataset: bool = True