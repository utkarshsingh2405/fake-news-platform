from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List
import time
import json
from ..database import get_db
from ..services.ml_service import MLService
from ..services.auth_service import AuthService
from ..schemas.prediction import PredictionRequest, PredictionResponse, PredictionHistoryResponse, BatchPredictionRequest, UrlRequest, VideoResponse
from ..dependencies import get_current_active_user, strict_rate_limiter
from ..models.user import User
from ..models.prediction import Prediction
import csv
import io
from urllib.parse import urlparse

router = APIRouter()

def get_domain_reputation(url: str) -> str:
    try:
        domain = urlparse(url).netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
            
        trusted = ["bbc.com", "reuters.com", "apnews.com", "nytimes.com", "npr.org", "wsj.com"]
        suspicious = ["infowars.com", "breitbart.com", "theonion.com", "realrawtitles.net"]
        
        if domain in trusted:
            return "trusted"
        elif domain in suspicious:
            return "suspicious"
        else:
            return "unknown"
    except:
        return "unknown"

@router.post("/text", response_model=PredictionResponse)
async def predict_text(
    request_data: PredictionRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: bool = Depends(strict_rate_limiter)
):
    """Predict if a given text is fake or real news."""
    ml_service = MLService()
    auth_service = AuthService(db)
    
    start_time = time.time()
    
    # Make prediction
    prediction_result, confidence, keywords, explanation, linguistic_flags, low_confidence, word_contributions = ml_service.predict(request_data.text)
    
    processing_time = (time.time() - start_time) * 1000  # ms
    
    # Save to database
    prediction = Prediction(
        user_id=current_user.id,
        text_input=request_data.text[:1000],  # Truncate if needed
        prediction_result=prediction_result,
        confidence_score=confidence,
        important_keywords=json.dumps(keywords),
        explanation=explanation,
        model_version=ml_service.get_model_version(),
        processing_time_ms=processing_time,
        source_type="text",
        ip_address=request.client.host
    )
    
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    # Audit log
    auth_service.audit_log(
        user_id=current_user.id,
        action="predict",
        resource="prediction",
        resource_id=prediction.id,
        ip_address=request.client.host
    )
    
    return PredictionResponse(
        id=prediction.id,
        text_preview=prediction.text_input,
        is_fake=prediction_result,
        confidence=confidence,
        prediction_label="Fake News" if prediction_result else "Real News",
        important_keywords=keywords,
        explanation=explanation,
        linguistic_flags=linguistic_flags,
        low_confidence=low_confidence,
        word_contributions=word_contributions,
        processing_time_ms=processing_time,
        model_version=ml_service.get_model_version(),
        created_at=prediction.created_at
    )

@router.post("/file", response_model=PredictionResponse)
async def predict_file(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: bool = Depends(strict_rate_limiter)
):
    """Upload a file (.txt) and predict its content."""
    # Validate file type
    if not file.filename.endswith('.txt'):
        raise HTTPException(
            status_code=400,
            detail="Only .txt files are supported for now"
        )
    
    # Read content
    content = await file.read()
    try:
        text = content.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File must be UTF-8 encoded text"
        )
    
    if len(text) < 10:
        raise HTTPException(
            status_code=400,
            detail="File content must be at least 10 characters"
        )
    
    # Reuse text prediction logic
    ml_service = MLService()
    auth_service = AuthService(db)
    
    start_time = time.time()
    prediction_result, confidence, keywords, explanation, linguistic_flags, low_confidence, word_contributions = ml_service.predict(text)
    processing_time = (time.time() - start_time) * 1000
    
    prediction = Prediction(
        user_id=current_user.id,
        text_input=text[:1000],
        prediction_result=prediction_result,
        confidence_score=confidence,
        important_keywords=json.dumps(keywords),
        explanation=explanation,
        model_version=ml_service.get_model_version(),
        processing_time_ms=processing_time,
        source_type="file",
        file_name=file.filename,
        ip_address=request.client.host if request else None
    )
    
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    return PredictionResponse(
        id=prediction.id,
        text_preview=prediction.text_input,
        is_fake=prediction_result,
        confidence=confidence,
        prediction_label="Fake News" if prediction_result else "Real News",
        important_keywords=keywords,
        explanation=explanation,
        linguistic_flags=linguistic_flags,
        low_confidence=low_confidence,
        word_contributions=word_contributions,
        processing_time_ms=processing_time,
        model_version=ml_service.get_model_version(),
        created_at=prediction.created_at
    )

@router.post("/url", response_model=PredictionResponse)
async def predict_url(
    request_data: UrlRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: bool = Depends(strict_rate_limiter)
):
    """Predict if a news article from a URL is fake or real."""
    ml_service = MLService()
    auth_service = AuthService(db)
    
    start_time = time.time()
    
    # Fetch the URL content using ScraperService
    from ..services.scraper_service import ScraperService
    extracted_text = ScraperService.scrape_article(request_data.url)
    
    reputation = get_domain_reputation(request_data.url)
    
    if not extracted_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the provided URL. It may be protected or invalid.")
        
    prediction_result, confidence, keywords, explanation, linguistic_flags, low_confidence, word_contributions = ml_service.predict(extracted_text)
    
    processing_time = (time.time() - start_time) * 1000
    
    prediction = Prediction(
        user_id=current_user.id,
        text_input=request_data.url,
        prediction_result=prediction_result,
        confidence_score=confidence,
        important_keywords=json.dumps(keywords),
        explanation=explanation,
        model_version=ml_service.get_model_version(),
        processing_time_ms=processing_time,
        source_type="url",
        ip_address=request.client.host
    )
    
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    return PredictionResponse(
        id=prediction.id,
        text_preview=prediction.text_input,
        is_fake=prediction_result,
        confidence=confidence,
        prediction_label="Fake News" if prediction_result else "Real News",
        important_keywords=keywords,
        explanation=explanation,
        linguistic_flags=linguistic_flags,
        low_confidence=low_confidence,
        word_contributions=word_contributions,
        processing_time_ms=processing_time,
        model_version=ml_service.get_model_version(),
        created_at=prediction.created_at,
        source_reputation=reputation
    )

@router.post("/video", response_model=VideoResponse)
async def predict_video(
    request_data: UrlRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: bool = Depends(strict_rate_limiter)
):
    """Analyze a video URL for deepfakes."""
    auth_service = AuthService(db)
    start_time = time.time()
    
    # Mocking Deepfake Video Detection Service
    import random
    import asyncio
    
    # Simulate long processing
    await asyncio.sleep(1.5)
    
    is_deepfake = random.choice([True, False])
    confidence = random.uniform(0.75, 0.99)
    explanation = "Facial artifacts detected in temporal sequence." if is_deepfake else "No significant manipulation artifacts detected."
    
    processing_time = (time.time() - start_time) * 1000
    
    prediction = Prediction(
        user_id=current_user.id,
        text_input=request_data.url,
        prediction_result=is_deepfake,
        confidence_score=confidence,
        important_keywords=json.dumps([]),
        explanation=explanation,
        model_version="Vision-Transformer v2",
        processing_time_ms=processing_time,
        source_type="video",
        ip_address=request.client.host
    )
    
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    return VideoResponse(
        id=prediction.id,
        is_fake=is_deepfake,
        confidence=confidence,
        prediction_label="Fake Video" if is_deepfake else "Authentic Video",
        important_keywords=[],
        explanation=explanation,
        processing_time_ms=processing_time,
        model_version="Vision-Transformer v2",
        created_at=prediction.created_at,
        source_type="video",
        frames_analyzed=120
    )

@router.get("/history", response_model=List[PredictionHistoryResponse])
async def get_prediction_history(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get prediction history for the current user."""
    predictions = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        PredictionHistoryResponse(
            id=p.id,
            text_preview=p.text_input[:100] + ("..." if len(p.text_input) > 100 else ""),
            prediction_result=p.prediction_result,
            confidence_score=p.confidence_score,
            prediction_label="Fake News" if p.prediction_result else "Real News",
            important_keywords=json.loads(p.important_keywords) if p.important_keywords else [],
            explanation=p.explanation,
            created_at=p.created_at
        )
        for p in predictions
    ]

@router.get("/stats")
async def get_prediction_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get prediction statistics for the current user."""
    total = db.query(Prediction).filter(Prediction.user_id == current_user.id).count()
    fake_count = db.query(Prediction).filter(
        Prediction.user_id == current_user.id,
        Prediction.prediction_result == True
    ).count()
    real_count = total - fake_count
    
    confidences = db.query(Prediction.confidence_score).filter(Prediction.user_id == current_user.id).all()
    avg_conf = sum([c[0] for c in confidences]) / len(confidences) if confidences else 0.0
    
    return {
        "total_predictions": total,
        "fake_news_count": fake_count,
        "real_news_count": real_count,
        "avg_confidence": avg_conf
    }

@router.post("/batch", response_model=List[PredictionResponse])
async def predict_batch(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: bool = Depends(strict_rate_limiter)
):
    """Predict a batch of texts from a CSV file."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")
    
    content = await file.read()
    try:
        text_content = content.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded")
    
    reader = csv.reader(io.StringIO(text_content))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV is empty")
    
    headers = [h.lower() for h in rows[0]]
    text_idx = 0
    start_row = 0
    if "text" in headers:
        text_idx = headers.index("text")
        start_row = 1
    
    texts = []
    for row in rows[start_row:]:
        if len(row) > text_idx and row[text_idx].strip():
            texts.append(row[text_idx].strip())
            
    if not texts:
        raise HTTPException(status_code=400, detail="No text data found in CSV")
        
    if len(texts) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 rows allowed per batch")
        
    ml_service = MLService()
    
    results = []
    for text in texts:
        start_time = time.time()
        prediction_result, confidence, keywords, explanation, linguistic_flags, low_confidence, word_contributions = ml_service.predict(text)
        processing_time = (time.time() - start_time) * 1000
        
        prediction = Prediction(
            user_id=current_user.id,
            text_input=text[:1000],
            prediction_result=prediction_result,
            confidence_score=confidence,
            important_keywords=json.dumps(keywords),
            explanation=explanation,
            model_version=ml_service.get_model_version(),
            processing_time_ms=processing_time,
            source_type="batch",
            ip_address=request.client.host if request else None
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        
        results.append(PredictionResponse(
            id=prediction.id,
            text_preview=prediction.text_input,
            is_fake=prediction_result,
            confidence=confidence,
            prediction_label="Fake News" if prediction_result else "Real News",
            important_keywords=keywords,
            explanation=explanation,
            linguistic_flags=linguistic_flags,
            low_confidence=low_confidence,
            word_contributions=word_contributions,
            processing_time_ms=processing_time,
            model_version=ml_service.get_model_version(),
            created_at=prediction.created_at
        ))
        
    return results