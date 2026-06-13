import os
import sys

# Ensure src path is imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_loader import load_data
from preprocessor import clean_text
import model_trainer as trainer

def run_test():
    print("1. Loading dataset...")
    df = load_data()
    print(f"Loaded {len(df)} samples.")
    
    print("\n2. Cleaning messages...")
    df['cleaned_message'] = df['message'].apply(clean_text)
    print("Cleaning completed.")
    
    print("\n3. Training model (Naive Bayes)...")
    model, vectorizer, metrics, split = trainer.train_and_evaluate(df, model_type='naive_bayes')
    print("Training completed.")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall: {metrics['recall']:.4f}")
    print(f"F1-Score: {metrics['f1_score']:.4f}")
    
    print("\n4. Saving model artifacts...")
    m_path, v_path = trainer.save_model_artifacts(model, vectorizer, 'naive_bayes')
    print("Model files saved at:")
    print(m_path)
    print(v_path)
    
    print("\n5. Running live inference test...")
    test_msg = "URGENT! Your account has been compromised. Visit our website http://scam.com to secure your funds."
    pred = trainer.predict_message(test_msg, model, vectorizer, clean_text)
    print(f"Message: {test_msg}")
    print(f"Prediction: {pred}")

if __name__ == "__main__":
    run_test()
