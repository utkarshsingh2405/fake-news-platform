import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from app.services.ml_service import MLService

def test():
    ml = MLService()
    
    real_news = "The government announced new economic policies to reduce inflation. The Federal Reserve raised interest rates by 0.25%."
    fake_news = "Breaking: UFO sighting confirmed by government officials! Aliens are real! The world leaders are secretly lizard people controlling the economy."
    
    res_real = ml.predict(real_news)
    res_fake = ml.predict(fake_news)
    
    print("Real news predict result (is_fake, confidence):", res_real[0], res_real[1])
    print("Fake news predict result (is_fake, confidence):", res_fake[0], res_fake[1])

if __name__ == "__main__":
    test()
