#!/usr/bin/env python3
"""
Complete ML training pipeline for fake news detection.
Trains multiple models and selects the best one.
"""
import pandas as pd
import numpy as np
import joblib
import os
import sys
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
import nltk
from nltk.corpus import stopwords
import warnings
warnings.filterwarnings('ignore')

# Add parent directory to path to import preprocess
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.preprocess import preprocess_text

# Download NLTK data if needed
nltk.download('stopwords')
nltk.download('punkt')
nltk.download('wordnet')

def load_data():
    """
    Load dataset.
    For production, replace with actual dataset (e.g., Kaggle Fake News dataset).
    """
    # Sample data - in production, load from CSV
    fake_news = [
        "Breaking: UFO sighting confirmed by government officials! Aliens are real!",
        "Miracle cure for cancer discovered, but pharmaceutical companies are hiding it!",
        "World leaders are secretly lizard people controlling the world economy.",
        "This shocking video proves that the earth is actually flat!",
        "Scientists admit global warming is a total hoax!",
        "Politician caught in scandal with alien ambassador, video leaked.",
        "New study shows that drinking bleach cures COVID-19, mainstream media lies.",
        "The moon landing was faked by Hollywood directors, here's proof.",
        "5G towers are causing coronavirus, experts reveal.",
        "Billionaires plan to escape earth leaving everyone behind."
    ]
    
    real_news = [
        "The government announced new economic policies to reduce inflation.",
        "Scientists publish peer-reviewed study on climate change effects.",
        "Local community organizes food drive for families in need.",
        "Company reports quarterly earnings exceeding analyst expectations.",
        "Researchers discover new species in Amazon rainforest.",
        "President signs new infrastructure bill into law.",
        "Stock market reaches all-time high as economy recovers.",
        "New vaccine approved by health authorities, distribution begins.",
        "International summit reaches agreement on trade deals.",
        "University receives grant for renewable energy research."
    ]
    
    # Add more realistic fake news patterns
    fake_news.extend([
        "SHOCKING: The truth about vaccines they don't want you to know!",
        "BREAKING: World leader resigns after secret video exposed!",
        "You won't believe what this celebrity did - media silent!",
        "This one trick removes all toxins from your body naturally!",
        "Government hiding evidence of alien contact for decades!"
    ])
    
    real_news.extend([
        "Senate passes bipartisan infrastructure bill with majority support.",
        "NASA successfully launches new Mars rover mission.",
        "Federal Reserve announces interest rate decision unchanged.",
        "United Nations calls for ceasefire in conflict region.",
        "Tech company unveils new smartphone with improved features."
    ])
    
    texts = fake_news + real_news
    labels = [1] * len(fake_news) + [0] * len(real_news)
    
    return texts, labels

def preprocess_dataset(texts):
    """Preprocess all texts."""
    print("Preprocessing texts...")
    processed = [preprocess_text(text) for text in texts]
    return processed

def train_models(X_train, y_train):
    """Train multiple models and return them."""
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Naive Bayes': MultinomialNB(),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42)
    }
    
    trained_models = {}
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        trained_models[name] = model
    
    return trained_models

def evaluate_models(models, X_test, y_test):
    """Evaluate all models and select best."""
    best_model = None
    best_score = 0
    best_name = ""
    
    for name, model in models.items():
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        print(f"\n{name} Results:")
        print(f"Accuracy: {accuracy:.4f}")
        print(f"F1 Score: {f1:.4f}")
        print(classification_report(y_test, y_pred, target_names=['Real', 'Fake']))
        print("Confusion Matrix:")
        print(confusion_matrix(y_test, y_pred))
        
        if accuracy > best_score:
            best_score = accuracy
            best_model = model
            best_name = name
    
    print(f"\nBest Model: {best_name} with accuracy {best_score:.4f}")
    return best_model, best_name

def save_model(model, vectorizer, model_path, vectorizer_path):
    """Save model and vectorizer."""
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)
    print(f"Model saved to {model_path}")
    print(f"Vectorizer saved to {vectorizer_path}")

def main():
    print("=" * 50)
    print("Fake News Detection - Model Training Pipeline")
    print("=" * 50)
    
    # Load data
    texts, labels = load_data()
    print(f"Loaded {len(texts)} samples ({sum(labels)} fake, {len(labels)-sum(labels)} real)")
    
    # Preprocess
    processed_texts = preprocess_dataset(texts)
    
    # Vectorize
    print("\nVectorizing texts with TF-IDF...")
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words='english')
    X = vectorizer.fit_transform(processed_texts)
    y = np.array(labels)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")
    
    # Train models
    models = train_models(X_train, y_train)
    
    # Evaluate and select best
    best_model, best_name = evaluate_models(models, X_test, y_test)
    
    # Save best model
    save_model(
        best_model,
        vectorizer,
        "../models/best_model.joblib",
        "../models/vectorizer.joblib"
    )
    
    print("\n✅ Training pipeline completed successfully!")

if __name__ == "__main__":
    main()