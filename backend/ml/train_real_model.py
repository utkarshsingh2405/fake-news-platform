import pandas as pd
import numpy as np
import joblib
import os
import sys
import json
import datetime
import argparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.preprocess import preprocess_text

def train_on_real_data(data_dir: str, max_features: int, test_size: float):
    true_path = os.path.join(data_dir, "True.csv")
    fake_path = os.path.join(data_dir, "Fake.csv")
    
    logger.info(f"Loading datasets from {data_dir}...")
    
    try:
        if not os.path.exists(true_path) or not os.path.exists(fake_path):
            logger.error(f"Datasets not found in {data_dir}. Please place True.csv and Fake.csv there.")
            return

        # Load datasets
        true_df = pd.read_csv(true_path)
        fake_df = pd.read_csv(fake_path)
        
        # Add labels: True = 0, Fake = 1
        true_df['label'] = 0
        fake_df['label'] = 1
        
        logger.info(f"Loaded {len(true_df)} real and {len(fake_df)} fake articles.")
        
        # Limit to 15,000 each for speed and memory
        if len(true_df) > 15000:
            true_df = true_df.sample(15000, random_state=42)
        if len(fake_df) > 15000:
            fake_df = fake_df.sample(15000, random_state=42)
            
        # Combine
        df = pd.concat([true_df, fake_df]).reset_index(drop=True)
        logger.info(f"Combined dataset size: {len(df)}")
        
        # We need a 'text' column. Sometimes it's 'text', sometimes 'title' + 'text'
        if 'title' in df.columns and 'text' in df.columns:
            df['full_text'] = df['title'] + " " + df['text']
        else:
            df['full_text'] = df['text']
            
        from app.services.preprocess import remove_data_leakage
        
        texts = [remove_data_leakage(t) for t in df['full_text'].fillna("").tolist()]
        labels = df['label'].tolist()
        
        # Train / Test split
        logger.info(f"Splitting dataset (test_size={test_size})...")
        X_train_raw, X_test_raw, y_train, y_test = train_test_split(
            texts, labels, test_size=test_size, stratify=labels, random_state=42
        )
        
        # Vectorize
        logger.info(f"Vectorizing (max_features={max_features})...")
        vectorizer = TfidfVectorizer(max_features=max_features, stop_words='english', ngram_range=(1,2))
        X_train = vectorizer.fit_transform(X_train_raw)
        X_test = vectorizer.transform(X_test_raw)
        
        logger.info("Training Logistic Regression model...")
        model = LogisticRegression(max_iter=1000)
        model.fit(X_train, y_train)
        
        logger.info("Evaluating on held-out test split...")
        y_pred = model.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        logger.info(f"Test Accuracy: {acc:.4f}")
        logger.info(f"Classification Report:\n{classification_report(y_test, y_pred)}")
        
        # Save models
        model_path = os.path.join(os.path.dirname(__file__), "models", "best_model.joblib")
        vec_path = os.path.join(os.path.dirname(__file__), "models", "vectorizer.joblib")
        
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(model, model_path)
        joblib.dump(vectorizer, vec_path)
        
        logger.info(f"Models successfully saved to {model_path} and {vec_path}")
        
        # Save metrics
        metrics = {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "trained_at": datetime.datetime.now().isoformat()
        }
        
        metrics_path = os.path.join(os.path.dirname(__file__), "models", "metrics.json")
        with open(metrics_path, "w") as f:
            json.dump(metrics, f, indent=4)
            
        logger.info(f"Metrics saved to {metrics_path}")
        
    except Exception as e:
        logger.error(f"Error during training: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the Fake News Detection Model")
    parser.add_argument("--data-dir", type=str, default=os.environ.get("ISOT_DATA_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")), help="Directory containing True.csv and Fake.csv")
    parser.add_argument("--max-features", type=int, default=5000, help="Maximum number of features for TF-IDF")
    parser.add_argument("--test-size", type=float, default=0.2, help="Proportion of the dataset to include in the test split")
    
    args = parser.parse_args()
    train_on_real_data(args.data_dir, args.max_features, args.test_size)
