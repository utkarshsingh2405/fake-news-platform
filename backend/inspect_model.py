import joblib
import numpy as np

def inspect():
    model_path = "./ml/models/best_model.joblib"
    vectorizer_path = "./ml/models/vectorizer.joblib"
    
    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    
    feature_names = vectorizer.get_feature_names_out()
    coef = model.coef_[0]
    
    # Top real words (negative coef if 1 is Fake)
    real_indices = np.argsort(coef)[:20]
    fake_indices = np.argsort(coef)[-20:][::-1]
    
    print("Top indicators for REAL (0):")
    for idx in real_indices:
        print(f"  {feature_names[idx]}: {coef[idx]:.4f}")
        
    print("\nTop indicators for FAKE (1):")
    for idx in fake_indices:
        print(f"  {feature_names[idx]}: {coef[idx]:.4f}")

if __name__ == "__main__":
    inspect()
