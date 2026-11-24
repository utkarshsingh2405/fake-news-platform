#!/usr/bin/env python3
"""
Model evaluation script.
"""
import joblib
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from train import load_data, preprocess_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def evaluate_model(model_path, vectorizer_path):
    """Load and evaluate saved model."""
    print("Loading model...")
    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    
    # Load test data
    texts, labels = load_data()
    processed = preprocess_dataset(texts)
    X = vectorizer.transform(processed)
    y = np.array(labels)
    
    # Predict
    y_pred = model.predict(X)
    
    # Metrics
    accuracy = accuracy_score(y, y_pred)
    precision = precision_score(y, y_pred)
    recall = recall_score(y, y_pred)
    f1 = f1_score(y, y_pred)
    
    print("\n" + "="*50)
    print("Model Evaluation Results")
    print("="*50)
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y, y_pred))
    
    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1
    }

if __name__ == "__main__":
    evaluate_model("../models/best_model.joblib", "../models/vectorizer.joblib")