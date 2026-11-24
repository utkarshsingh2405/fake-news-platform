"""
Tests for ML service.
"""
import pytest
import sys
import os
import json
from unittest.mock import patch, MagicMock, mock_open
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ml_service import MLService
from app.services.preprocess import preprocess_text, extract_keywords

@pytest.fixture
def mock_ml_service():
    """Create ML service instance with mocked paths."""
    MLService._instance = None
    with patch('os.path.exists') as mock_exists, \
         patch('joblib.load') as mock_load, \
         patch('os.path.getsize') as mock_size:
        
        # mock exists for model and vectorizer
        mock_exists.side_effect = lambda x: True
        mock_size.return_value = 1024
        
        # mock model
        mock_model = MagicMock()
        mock_model.predict_proba.return_value = [[0.8, 0.2]]
        mock_model.classes_ = [0, 1]
        mock_model.coef_ = [[0.5, -0.2]]
        
        # mock vectorizer
        mock_vec = MagicMock()
        mock_vec_transform = MagicMock()
        mock_vec_transform.toarray.return_value = [[1.0, 0.5]]
        mock_vec.transform.return_value = mock_vec_transform
        mock_vec.get_feature_names_out.return_value = ["test", "word"]
        
        mock_load.side_effect = [mock_model, mock_vec]
        
        service = MLService()
        return service, mock_model

def test_ml_service_loads_without_fallback(mock_ml_service):
    """Test MLService loads without falling back."""
    service, _ = mock_ml_service
    assert service._model is not None
    assert service._vectorizer is not None

def test_predict_real_and_fake(mock_ml_service):
    service, mock_model = mock_ml_service
    
    # fake prediction
    mock_model.predict_proba.return_value = [[0.1, 0.9]]
    is_fake, conf, kw, exp, flags, low_conf, contribs = service.predict("Shocking fake news aliens")
    assert is_fake is True
    assert conf == 0.9
    assert flags.get('sensational_score', 0) > 0
    
    # real prediction
    mock_model.predict_proba.return_value = [[0.9, 0.1]]
    is_fake, conf, kw, exp, flags, low_conf, contribs = service.predict("Study published by government")
    assert is_fake is False
    assert conf == 0.9
    assert flags.get('reliable_score', 0) > 0

def test_get_model_metrics(mock_ml_service):
    service, _ = mock_ml_service
    
    mock_metrics = '{"accuracy": 0.95, "precision": 0.92, "recall": 0.94, "f1_score": 0.93}'
    with patch('os.path.exists', return_value=True), \
         patch('builtins.open', mock_open(read_data=mock_metrics)):
        metrics = service.get_model_metrics()
        assert metrics.get("accuracy") == 0.95
        assert metrics.get("f1_score") == 0.93

def test_preprocess_text_basic():
    """Test basic text preprocessing."""
    text = "Breaking: This is a TEST article about FAKE news!"
    processed = preprocess_text(text)
    assert isinstance(processed, str)
    assert "breaking" in processed
    assert "test" in processed
    assert "fake" in processed

def test_extract_keywords():
    """Test keyword extraction."""
    text = "The government announced new economic policies."
    keywords = extract_keywords(text, top_n=3)
    assert isinstance(keywords, list)
    assert len(keywords) <= 3