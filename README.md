# AI-Powered Fake News Detection Platform

## Overview
A production-ready full-stack application that uses machine learning to detect fake news articles. Users can submit text, upload files, and get instant predictions with confidence scores and keyword explanations.

## Features
- 🔍 **Real-time fake news detection** using NLP and ML
- 📊 **Confidence scoring** with visual indicators
- 🔑 **JWT authentication** with role-based access (user/admin)
- 📁 **File upload support** (.txt files)
- 📈 **User dashboard** with prediction history and analytics
- 👑 **Admin panel** for user management, analytics, and model retraining
- 🎨 **Modern responsive UI** with dark mode support
- 🐳 **Dockerized** for easy deployment

## Tech Stack

### Backend
- FastAPI (Python)
- PostgreSQL with SQLAlchemy ORM
- JWT authentication
- Scikit-learn, NLTK for ML/NLP
- Alembic for migrations

### Frontend
- React 18 with Vite
- Tailwind CSS
- React Router v6
- Axios
- Recharts for analytics

### DevOps
- Docker & Docker Compose
- Nginx (production)
- GitHub Actions CI/CD

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use Docker)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/utkarshsingh2405/fake-news-platform.git
cd fake-news-platform

cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database URL and secrets

# Create PostgreSQL database
createdb fake_news_db

# Run migrations
alembic upgrade head

cd ml
python train.py

cd ..
uvicorn app.main:app --reload

cd frontend
npm install
npm run dev

Access the app

Frontend: http://localhost:5173

Backend API: http://localhost:8000

API docs: http://localhost:8000/api/docs


Docker Deployment :

docker-compose up -d