"""
Tests for prediction endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.services.auth_service import AuthService
from io import BytesIO

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_prediction.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def auth_token():
    """Create a test user and return access token."""
    client = TestClient(app)
    client.post("/api/auth/register", json={
        "username": "preduser",
        "email": "pred@example.com",
        "password": "Test123456"
    })
    login_resp = client.post("/api/auth/login", json={
        "email": "pred@example.com",
        "password": "Test123456"
    })
    return login_resp.json()["access_token"]

client = TestClient(app)

def test_predict_text_success(auth_token):
    """Test text prediction with valid input."""
    response = client.post("/api/predict/text", 
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"text": "This is a test news article about politics."}
    )
    assert response.status_code == 200
    data = response.json()
    assert "is_fake" in data
    assert "confidence" in data
    assert "prediction_label" in data
    assert "important_keywords" in data
    assert "processing_time_ms" in data
    assert "model_version" in data
    assert isinstance(data["is_fake"], bool)
    assert 0 <= data["confidence"] <= 1

def test_predict_text_too_short(auth_token):
    """Test prediction with text too short."""
    response = client.post("/api/predict/text",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"text": "Short"}
    )
    assert response.status_code == 422  # Validation error

def test_predict_text_empty(auth_token):
    """Test prediction with empty text."""
    response = client.post("/api/predict/text",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"text": "   "}
    )
    assert response.status_code == 422

def test_predict_file_success(auth_token):
    """Test file upload prediction."""
    file_content = b"This is a test news article about technology and innovation."
    files = {"file": ("test.txt", BytesIO(file_content), "text/plain")}
    response = client.post("/api/predict/file",
        headers={"Authorization": f"Bearer {auth_token}"},
        files=files
    )
    assert response.status_code == 200
    data = response.json()
    assert "is_fake" in data
    assert "confidence" in data

def test_predict_file_wrong_extension(auth_token):
    """Test upload with unsupported file type."""
    files = {"file": ("test.pdf", BytesIO(b"content"), "application/pdf")}
    response = client.post("/api/predict/file",
        headers={"Authorization": f"Bearer {auth_token}"},
        files=files
    )
    assert response.status_code == 400
    assert "Only .txt files are supported" in response.json()["detail"]

def test_predict_file_empty_content(auth_token):
    """Test upload of empty file."""
    files = {"file": ("empty.txt", BytesIO(b""), "text/plain")}
    response = client.post("/api/predict/file",
        headers={"Authorization": f"Bearer {auth_token}"},
        files=files
    )
    # Should fail because text length < 10
    assert response.status_code == 400
    assert "at least 10 characters" in response.json()["detail"]

def test_get_prediction_history(auth_token):
    """Test retrieving prediction history."""
    # Make a prediction first
    client.post("/api/predict/text",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"text": "First test article"}
    )
    client.post("/api/predict/text",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"text": "Second test article about fake news"}
    )
    
    # Get history
    response = client.get("/api/predict/history",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    history = response.json()
    assert isinstance(history, list)
    assert len(history) >= 2
    assert "text_preview" in history[0]
    assert "prediction_result" in history[0]
    assert "confidence_score" in history[0]
    assert "created_at" in history[0]

def test_get_prediction_history_pagination(auth_token):
    """Test history with skip/limit."""
    # Create multiple predictions
    for i in range(5):
        client.post("/api/predict/text",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"text": f"Article number {i}"}
        )
    
    # Get first 2
    response = client.get("/api/predict/history?skip=0&limit=2",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert len(response.json()) == 2
    
    # Get next 2
    response = client.get("/api/predict/history?skip=2&limit=2",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert len(response.json()) == 2

def test_get_prediction_stats(auth_token):
    """Test prediction statistics endpoint."""
    # Create some predictions
    texts = [
        "Fake news example: miracle cure discovered!",
        "Real news: economic report published",
        "Another fake story about aliens",
        "Real news: scientific breakthrough"
    ]
    for text in texts:
        client.post("/api/predict/text",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"text": text}
        )
    
    response = client.get("/api/predict/stats",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_predictions" in data
    assert "fake_news_count" in data
    assert "real_news_count" in data
    assert data["total_predictions"] >= 4
    assert data["fake_news_count"] + data["real_news_count"] == data["total_predictions"]

def test_predict_unauthenticated():
    """Test prediction without authentication."""
    response = client.post("/api/predict/text", json={"text": "Some text"})
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]