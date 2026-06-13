import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report, roc_curve, auc

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")

def get_model(model_type):
    """
    Returns the instantiated model based on the type.
    """
    if model_type == 'naive_bayes':
        return MultinomialNB()
    elif model_type == 'logistic_regression':
        return LogisticRegression(max_iter=1000, random_state=42)
    elif model_type == 'random_forest':
        return RandomForestClassifier(n_estimators=100, random_state=42)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

def train_and_evaluate(df, model_type='naive_bayes', test_size=0.2, max_features=3000):
    """
    Splits the data, vectorizes it using TF-IDF, trains a model,
    evaluates it, and returns the model, vectorizer, and metrics.
    """
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
        
    # Ensure cleaned_message column exists
    # If not, we will raise an error (it should be preprocessed first)
    if 'cleaned_message' not in df.columns:
        raise ValueError("DataFrame must contain 'cleaned_message' column.")
        
    # Map label to numeric (ham: 0, spam: 1)
    # The dataset has classes: 'ham' and 'spam'
    df['label_num'] = df['label'].map({'ham': 0, 'spam': 1})
    
    # Split the dataset
    X_train, X_test, y_train, y_test = train_test_split(
        df['cleaned_message'], 
        df['label_num'], 
        test_size=test_size, 
        random_state=42, 
        stratify=df['label_num']
    )
    
    # Vectorize text using TF-IDF
    vectorizer = TfidfVectorizer(max_features=max_features)
    X_train_vectorized = vectorizer.fit_transform(X_train)
    X_test_vectorized = vectorizer.transform(X_test)
    
    # Initialize and train model
    model = get_model(model_type)
    model.fit(X_train_vectorized, y_train)
    
    # Predictions
    y_pred = model.predict(X_test_vectorized)
    
    # Probability predictions for ROC
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test_vectorized)[:, 1]
    else:
        # Fallback if model doesn't support predict_proba
        y_prob = model.decision_function(X_test_vectorized)
        
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=['ham', 'spam'], output_dict=True)
    
    # Calculate ROC Curve
    fpr, tpr, thresholds = roc_curve(y_test, y_prob)
    roc_auc = auc(fpr, tpr)
    
    metrics = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'confusion_matrix': cm.tolist(), # Convert to list for serialization
        'classification_report': report,
        'roc_curve': {
            'fpr': fpr.tolist(),
            'tpr': tpr.tolist(),
            'auc': roc_auc
        }
    }
    
    return model, vectorizer, metrics, (X_train, X_test, y_train, y_test)

def save_model_artifacts(model, vectorizer, model_type='naive_bayes'):
    """
    Saves the trained model and vectorizer as pickle files.
    """
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
        
    model_path = os.path.join(MODELS_DIR, f"{model_type}_model.pkl")
    vectorizer_path = os.path.join(MODELS_DIR, f"{model_type}_vectorizer.pkl")
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    with open(vectorizer_path, 'wb') as f:
        pickle.dump(vectorizer, f)
        
    print(f"Model and Vectorizer saved to {MODELS_DIR}")
    return model_path, vectorizer_path

def load_model_artifacts(model_type='naive_bayes'):
    """
    Loads the saved model and vectorizer files.
    """
    model_path = os.path.join(MODELS_DIR, f"{model_type}_model.pkl")
    vectorizer_path = os.path.join(MODELS_DIR, f"{model_type}_vectorizer.pkl")
    
    if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
        raise FileNotFoundError("Model or Vectorizer file not found. Please train the model first.")
        
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
        
    with open(vectorizer_path, 'rb') as f:
        vectorizer = pickle.load(f)
        
    return model, vectorizer

def predict_message(message, model, vectorizer, preprocessor_fn):
    """
    Predicts whether a single message is Spam or Ham using loaded artifacts.
    """
    cleaned = preprocessor_fn(message)
    vectorized = vectorizer.transform([cleaned])
    
    prediction = model.predict(vectorized)[0]
    
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(vectorized)[0]
        ham_prob, spam_prob = probabilities[0], probabilities[1]
    else:
        spam_prob = 1.0 if prediction == 1 else 0.0
        ham_prob = 1.0 - spam_prob
        
    label = "spam" if prediction == 1 else "ham"
    
    return {
        'label': label,
        'ham_probability': float(ham_prob),
        'spam_probability': float(spam_prob)
    }
