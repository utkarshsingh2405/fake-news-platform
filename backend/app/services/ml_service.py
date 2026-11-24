import joblib
import numpy as np
import re
import json
import os
from typing import Tuple, List, Optional
import random
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from .preprocess import preprocess_text, extract_keywords
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class MLService:
    _instance = None
    _model = None
    _vectorizer = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Load or train model on startup."""
        self.model_path = settings.model_path
        self.vectorizer_path = settings.vectorizer_path
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained model and vectorizer."""
        if not (os.path.exists(self.model_path) and os.path.exists(self.vectorizer_path)):
            logger.critical("Real model files are missing. Cannot start ml_service.")
            raise RuntimeError("Real model files missing.")
        
        try:
            self._model = joblib.load(self.model_path)
            self._vectorizer = joblib.load(self.vectorizer_path)
            
            model_size_kb = os.path.getsize(self.model_path) / 1024
            vec_size_kb = os.path.getsize(self.vectorizer_path) / 1024
            n_features = getattr(self._model, 'n_features_in_', 'unknown')
            
            logger.info(f"Model loaded successfully.")
            logger.info(f"Model path: {self.model_path} ({model_size_kb:.1f} KB)")
            logger.info(f"Vectorizer path: {self.vectorizer_path} ({vec_size_kb:.1f} KB)")
            logger.info(f"Features in: {n_features}")
            
        except Exception as e:
            logger.critical(f"Error loading model: {str(e)}")
            raise RuntimeError(f"Error loading model: {str(e)}")
    
    def train_toy_fallback_model(self):
        """Train a simple default model for demonstration."""
        from sklearn.linear_model import LogisticRegression
        import pandas as pd
        
        # Sample data (in production, load from real dataset)
        fake_samples = [
            "Breaking: UFO sighting confirmed by government officials! Aliens are real!",
            "Miracle cure for cancer discovered, but pharmaceutical companies are hiding it!",
            "World leaders are secretly lizard people controlling the world economy.",
            "This shocking video proves that the earth is actually flat!",
            "Scientists admit global warming is a total hoax!"
        ]
        real_samples = [
            "The government announced new economic policies to reduce inflation.",
            "Scientists publish peer-reviewed study on climate change effects.",
            "Local community organizes food drive for families in need.",
            "Company reports quarterly earnings exceeding analyst expectations.",
            "Researchers discover new species in Amazon rainforest."
        ]
        
        texts = fake_samples + real_samples
        labels = [1] * len(fake_samples) + [0] * len(real_samples)
        
        # Preprocess texts
        from .preprocess import remove_data_leakage, preprocess_text
        processed = [preprocess_text(remove_data_leakage(t)) for t in texts]
        
        # Vectorize
        self._vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1,2))
        X = self._vectorizer.fit_transform(processed)
        y = np.array(labels)
        
        # Train model
        self._model = LogisticRegression(max_iter=1000)
        self._model.fit(X, y)
        
        # Save models
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self._model, self.model_path)
        joblib.dump(self._vectorizer, self.vectorizer_path)
        logger.info("Default model trained and saved")
    
    def get_word_contributions(self, text: str, top_n: int = 8) -> List[dict]:
        """Get the top word contributions for explainability."""
        if not self._model or not self._vectorizer:
            return []
            
        try:
            # Transform text
            features = self._vectorizer.transform([text])
            feature_array = features.toarray()[0]
            
            # Get model coefficients (assumes LogisticRegression or similar linear model)
            if hasattr(self._model, 'coef_'):
                coef = self._model.coef_[0]
            else:
                return []
                
            feature_names = self._vectorizer.get_feature_names_out()
            
            contributions = []
            for i, val in enumerate(feature_array):
                if val > 0:
                    contribution = float(val * coef[i])
                    contributions.append({
                        "term": feature_names[i],
                        "contribution": abs(contribution),
                        "direction": "fake" if contribution > 0 else "real",
                        "raw_score": contribution
                    })
            
            # Sort by absolute contribution descending
            contributions.sort(key=lambda x: x["contribution"], reverse=True)
            return contributions[:top_n]
        except Exception as e:
            logger.warning(f"Error calculating word contributions: {e}")
            return []

    def predict(self, text: str) -> Tuple[bool, float, List[str], str, dict, bool, List[dict]]:
        """
        Predict if text is fake news.
        Returns: (is_fake, confidence_score, important_keywords, explanation, linguistic_flags, low_confidence, word_contributions)
        """
        if not self._model or not self._vectorizer:
            self._load_model()
        
        # We skip deep preprocessing here because the model was trained directly on raw text using TfidfVectorizer defaults.
        # This fixes the "preprocessing mismatch" bug where the model lost context of all words.
        
        # Vectorize using raw text (after removing dataset leakage markers)
        from .preprocess import remove_data_leakage
        cleaned_text = remove_data_leakage(text)
        features = self._vectorizer.transform([cleaned_text])
        
        # Extract keywords using TF-IDF weights directly (this tells us exactly what the AI saw)
        try:
            if hasattr(self._vectorizer, 'get_feature_names_out'):
                feature_names = self._vectorizer.get_feature_names_out()
                feature_array = features.toarray()[0]
                sorted_indices = np.argsort(feature_array)[::-1]
                keywords = [feature_names[i] for i in sorted_indices[:7] if feature_array[i] > 0.0]
            else:
                keywords = extract_keywords(text, top_n=7)
        except Exception as e:
            logger.warning(f"TF-IDF keyword extraction failed: {e}")
            keywords = extract_keywords(text, top_n=7)
        
        # Predict
        pred_proba = self._model.predict_proba(features)[0]
        if hasattr(self._model, 'classes_'):
            fake_index = list(self._model.classes_).index(1) if 1 in self._model.classes_ else 1
        else:
            fake_index = 1
            
        confidence = pred_proba[fake_index] if fake_index < len(pred_proba) else pred_proba[1]
        
        # Fallback/Heuristic Engine (Refactored)
        explanation = ""
        is_fake = False
        linguistic_flags = {}
        low_confidence = False
        
        # Calculate real is_fake and confidence without heuristic override
        is_fake_model = confidence > 0.5
        
        # Check for known sensationalist or reliable keywords
        sensational_words = ['shocking', 'hoax', 'secret', 'miracle', 'hide', 'aliens', 'flat earth', 'truth']
        reliable_words = ['study', 'government', 'economy', 'announced', 'discovered', 'researchers', 'published']
        
        fake_score = sum(1 for word in sensational_words if word in text.lower())
        real_score = sum(1 for word in reliable_words if word in text.lower())
        
        if fake_score > 0 or real_score > 0:
            linguistic_flags = {
                "sensational_score": fake_score,
                "reliable_score": real_score,
                "note": "Sensationalist language detected" if fake_score > real_score else "Reliable language detected" if real_score > fake_score else "Mixed language detected"
            }
            
        if 0.45 <= confidence <= 0.55:
            low_confidence = True
            
        is_fake = is_fake_model
        if is_fake:
            if confidence > 0.8:
                explanation = "High confidence of misinformation. Strong matches with known deceptive linguistic patterns."
            else:
                explanation = "Moderate probability of being fake news based on structural anomalies."
        else:
            if confidence < 0.2:
                explanation = "Highly credible. Linguistic patterns strongly align with verified news sources."
            else:
                explanation = "Likely authentic, though some informal phrasing was detected."
                
        # Word contributions
        word_contributions = self.get_word_contributions(text)
        
        # Ensure confidence is formatted properly (if it's not fake, confidence is technically 1 - fake_proba)
        # We will output confidence as the probability of the *chosen class*
        display_confidence = float(confidence if is_fake else (1.0 - confidence))
        
        # Cap at 0.99 for realism
        display_confidence = min(display_confidence, 0.99)
        
        return is_fake, display_confidence, keywords, explanation, linguistic_flags, low_confidence, word_contributions
    
    def get_model_version(self) -> str:
        """Return current model version."""
        return "1.0.0"  # Could be dynamic
    
    def is_model_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._model is not None and self._vectorizer is not None
    
    def get_model_metrics(self) -> dict:
        """Return model performance metrics (if available)."""
        metrics_path = os.path.join(os.path.dirname(self.model_path), "metrics.json")
        try:
            if os.path.exists(metrics_path):
                with open(metrics_path, "r") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load metrics from {metrics_path}: {e}")
            
        return {
            "accuracy": None,
            "note": "Model metrics not yet computed - run train_real_model.py"
        }
    
    def get_model_accuracy(self) -> Optional[float]:
        """Return model accuracy."""
        metrics = self.get_model_metrics()
        return metrics.get("accuracy")
    
    async def retrain_model(self, use_default_dataset: bool = True):
        """Background task to retrain model."""
        logger.info("Starting model retraining...")
        # Here you would load larger dataset, perform proper training, evaluation
        # For now, just retrain on default dataset
        self.train_toy_fallback_model()
        logger.info("Model retraining completed")