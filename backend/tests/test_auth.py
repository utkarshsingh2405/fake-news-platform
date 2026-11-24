"""
Tests for authentication endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.services.auth_service import AuthService
import os

# Use SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
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

client = TestClient(app)

def test_register_success():
    """Test user registration with valid data."""
    response = client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test123456",
        "full_name": "Test User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert data["is_active"] == True
    assert data["is_admin"] == False

def test_register_duplicate_email():
    """Test registration with existing email."""
    client.post("/api/auth/register", json={
        "username": "user1",
        "email": "duplicate@example.com",
        "password": "Test123456"
    })
    response = client.post("/api/auth/register", json={
        "username": "user2",
        "email": "duplicate@example.com",
        "password": "Test123456"
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_register_duplicate_username():
    """Test registration with existing username."""
    client.post("/api/auth/register", json={
        "username": "duplicateuser",
        "email": "email1@example.com",
        "password": "Test123456"
    })
    response = client.post("/api/auth/register", json={
        "username": "duplicateuser",
        "email": "email2@example.com",
        "password": "Test123456"
    })
    assert response.status_code == 400
    assert "already taken" in response.json()["detail"]

def test_register_invalid_username():
    """Test registration with invalid characters in username."""
    response = client.post("/api/auth/register", json={
        "username": "test user!",
        "email": "test@example.com",
        "password": "Test123456"
    })
    assert response.status_code == 422  # Validation error

def test_login_success():
    """Test login with correct credentials."""
    # Register first
    client.post("/api/auth/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "Test123456"
    })
    # Login
    response = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "Test123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password():
    """Test login with incorrect password."""
    client.post("/api/auth/register", json={
        "username": "wrongpass",
        "email": "wrong@example.com",
        "password": "Correct123"
    })
    response = client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "WrongPassword"
    })
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_login_nonexistent_email():
    """Test login with email that doesn't exist."""
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "AnyPassword"
    })
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_refresh_token():
    """Test refreshing access token."""
    # Register and login
    client.post("/api/auth/register", json={
        "username": "refreshtest",
        "email": "refresh@example.com",
        "password": "Test123456"
    })
    login_resp = client.post("/api/auth/login", json={
        "email": "refresh@example.com",
        "password": "Test123456"
    })
    refresh_token = login_resp.json()["refresh_token"]
    
    # Refresh
    response = client.post("/api/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_refresh_invalid_token():
    """Test refresh with invalid token."""
    response = client.post("/api/auth/refresh", json={
        "refresh_token": "invalid.token.here"
    })
    assert response.status_code == 401
    assert "Invalid or expired refresh token" in response.json()["detail"]

def test_get_current_user():
    """Test getting current authenticated user."""
    # Register and login
    client.post("/api/auth/register", json={
        "username": "currentuser",
        "email": "current@example.com",
        "password": "Test123456"
    })
    login_resp = client.post("/api/auth/login", json={
        "email": "current@example.com",
        "password": "Test123456"
    })
    access_token = login_resp.json()["access_token"]
    
    # Get user info
    response = client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {access_token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "current@example.com"
    assert data["username"] == "currentuser"

def test_get_current_user_unauthenticated():
    """Test accessing protected endpoint without token."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

def test_logout():
    """Test logout endpoint (just logs action, doesn't invalidate token)."""
    client.post("/api/auth/register", json={
        "username": "logoutuser",
        "email": "logout@example.com",
        "password": "Test123456"
    })
    login_resp = client.post("/api/auth/login", json={
        "email": "logout@example.com",
        "password": "Test123456"
    })
    access_token = login_resp.json()["access_token"]
    
    response = client.post("/api/auth/logout", headers={
        "Authorization": f"Bearer {access_token}"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"