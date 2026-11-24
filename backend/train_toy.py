from app.services.ml_service import MLService
def run():
    ml = MLService()
    ml.train_toy_fallback_model()
    print("Fallback toy model generated.")
if __name__ == "__main__":
    run()
