from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
import pandas as pd
import io
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from sqlalchemy import func, and_
from ..database import get_db
from ..models.user import User
from ..models.prediction import Prediction
from ..models.audit import AuditLog
from ..schemas.admin import UserUpdate, UserResponse, AdminAnalyticsResponse, RetrainRequest
from ..dependencies import get_current_admin_user
from ..services.ml_service import MLService
import json

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)."""
    users = db.query(User).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        pred_count = db.query(Prediction).filter(Prediction.user_id == user.id).count()
        result.append(UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at,
            last_login=user.last_login,
            predictions_count=pred_count
        ))
    return result

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get a specific user by ID (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    pred_count = db.query(Prediction).filter(Prediction.user_id == user.id).count()
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at,
        last_login=user.last_login,
        predictions_count=pred_count
    )

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user details (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.username is not None:
        user.username = user_update.username
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.is_admin is not None:
        user.is_admin = user_update.is_admin
    
    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/analytics", response_model=AdminAnalyticsResponse)
async def get_analytics(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get platform analytics (admin only)."""
    # Total users
    total_users = db.query(User).count()
    
    # Active users last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = db.query(User).filter(User.last_login >= thirty_days_ago).count()
    
    # Predictions stats
    total_predictions = db.query(Prediction).count()
    fake_predictions = db.query(Prediction).filter(Prediction.prediction_result == True).count()
    real_predictions = total_predictions - fake_predictions
    
    # Average confidence
    avg_confidence = db.query(func.avg(Prediction.confidence_score)).scalar() or 0.0
    
    # Predictions by day (last 7 days)
    predictions_by_day = []
    for i in range(7):
        day = datetime.utcnow().date() - timedelta(days=i)
        next_day = day + timedelta(days=1)
        count = db.query(Prediction).filter(
            Prediction.created_at >= day,
            Prediction.created_at < next_day
        ).count()
        predictions_by_day.append({"date": day.isoformat(), "count": count})
    
    # Recent activity (last 10 actions)
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    recent_activity = [
        {
            "action": log.action,
            "user_id": log.user_id,
            "created_at": log.created_at.isoformat(),
            "details": log.details
        }
        for log in recent_logs
    ]
    
    # Model accuracy from ML service
    ml_service = MLService()
    model_accuracy = ml_service.get_model_accuracy()
    
    return AdminAnalyticsResponse(
        total_users=total_users,
        active_users_last_30d=active_users,
        total_predictions=total_predictions,
        fake_predictions_count=fake_predictions,
        real_predictions_count=real_predictions,
        average_confidence=avg_confidence,
        predictions_by_day=predictions_by_day,
        model_accuracy=model_accuracy,
        recent_activity=recent_activity
    )

@router.post("/retrain")
async def retrain_model(
    retrain_request: RetrainRequest,
    background_tasks: BackgroundTasks,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Trigger model retraining (admin only)."""
    ml_service = MLService()
    
    # Add retraining as background task
    background_tasks.add_task(ml_service.retrain_model, retrain_request.use_default_dataset)
    
    # Log admin action
    audit = AuditLog(
        user_id=admin.id,
        action="admin_action",
        resource="model_retrain",
        details=json.dumps({"request": retrain_request.dict()}),
        ip_address=None  # Could capture from request
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Model retraining started in background"}

@router.post("/upload-dataset")
async def upload_dataset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upload a CSV dataset to train the ML model."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    
    # Run the training in background so we don't block
    ml_service = MLService()
    
    def train_on_csv(csv_content):
        try:
            df = pd.read_csv(io.BytesIO(csv_content))
            # Kaggle fake news dataset typically has 'text' and 'label' columns
            # label 1 = fake, label 0 = real
            if 'text' not in df.columns or 'label' not in df.columns:
                return # Log error in production
            
            # Subsample for speed if it's too big
            if len(df) > 5000:
                df = df.sample(5000)
                
            texts = df['text'].fillna("").tolist()
            labels = df['label'].tolist()
            
            # Simple retraining logic
            ml_service._vectorizer = ml_service._vectorizer.__class__(max_features=5000, stop_words='english')
            X = ml_service._vectorizer.fit_transform(texts)
            ml_service._model.fit(X, labels)
            
            import joblib
            import os
            os.makedirs(os.path.dirname(ml_service.model_path), exist_ok=True)
            joblib.dump(ml_service._model, ml_service.model_path)
            joblib.dump(ml_service._vectorizer, ml_service.vectorizer_path)
        except Exception as e:
            print(f"Dataset training failed: {e}")

    background_tasks.add_task(train_on_csv, content)
    
    return {"message": "Dataset uploaded successfully. Model training has started in the background."}


@router.get("/logs")
async def get_system_logs(
    limit: int = 100,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get audit logs (admin only)."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [{"id": log.id, "user_id": log.user_id, "action": log.action, "details": log.details, "created_at": log.created_at} for log in logs]