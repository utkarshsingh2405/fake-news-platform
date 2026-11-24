from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

class PredictionRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=5000)
    
    @field_validator("text")
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError("Text cannot be empty or whitespace only")
        return v.strip()

class UrlRequest(BaseModel):
    url: str
    
class PredictionResponse(BaseModel):
    id: int
    text_preview: str = ""
    is_fake: bool
    confidence: float  # 0-1, higher means more confident about prediction
    prediction_label: str  # "Fake News" or "Real News"
    important_keywords: List[str]
    explanation: Optional[str] = None
    linguistic_flags: Optional[dict] = None
    low_confidence: Optional[bool] = False
    word_contributions: Optional[List[dict]] = None
    processing_time_ms: float
    model_version: str
    created_at: datetime
    source_reputation: Optional[str] = None

class VideoResponse(PredictionResponse):
    source_type: str = "video"
    frames_analyzed: int = 120

class PredictionHistoryResponse(BaseModel):
    id: int
    text_preview: str
    prediction_result: bool
    confidence_score: float
    prediction_label: str
    important_keywords: List[str]
    explanation: Optional[str] = None
    created_at: datetime

class BatchPredictionRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1, max_items=50)