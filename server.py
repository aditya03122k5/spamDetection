import os
import sys
import io
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, send_file
from collections import Counter

# Add src to the path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from data_loader import load_data
from preprocessor import clean_text
import model_trainer as trainer

# WordCloud import with fallback
WORDCLOUD_AVAILABLE = False
try:
    from wordcloud import WordCloud
    WORDCLOUD_AVAILABLE = True
except ImportError:
    pass

app = Flask(__name__, static_folder='static', static_url_path='')

# Global workspace state variables
raw_data = None
cleaned_data = None
trained_model = None
vectorizer = None
metrics = None
model_name = None

def get_saved_models():
    """Helper to check which model pickles exist in the models/ directory."""
    models_dir = trainer.MODELS_DIR
    if not os.path.exists(models_dir):
        return []
    
    saved = []
    for m_type in ['naive_bayes', 'logistic_regression', 'random_forest']:
        model_path = os.path.join(models_dir, f"{m_type}_model.pkl")
        vect_path = os.path.join(models_dir, f"{m_type}_vectorizer.pkl")
        if os.path.exists(model_path) and os.path.exists(vect_path):
            saved.append(m_type)
    return saved

@app.route('/')
def index():
    """Serves the index.html frontend page."""
    return send_file('index.html')

@app.route('/api/status', methods=['GET'])
def get_status():
    """Returns the current state of the workspace."""
    global raw_data, cleaned_data, trained_model, metrics, model_name
    return jsonify({
        "raw_data_loaded": raw_data is not None,
        "raw_data_size": len(raw_data) if raw_data is not None else 0,
        "cleaned_data_loaded": cleaned_data is not None,
        "model_trained": trained_model is not None,
        "model_name": model_name,
        "metrics": metrics,
        "saved_models": get_saved_models()
    })

@app.route('/api/load_data', methods=['POST'])
def handle_load_data():
    """Loads dataset into memory."""
    global raw_data
    try:
        raw_data = load_data()
        preview = raw_data.head(10).to_dict(orient='records')
        return jsonify({
            "status": "success",
            "samples": len(raw_data),
            "preview": preview
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/clean_data', methods=['POST'])
def handle_clean_data():
    """Runs data preprocessing pipeline on loaded dataset."""
    global raw_data, cleaned_data
    if raw_data is None:
        return jsonify({"status": "error", "message": "Dataset not loaded"}), 400
    try:
        df = raw_data.copy()
        df['cleaned_message'] = df['message'].apply(clean_text)
        cleaned_data = df
        preview = cleaned_data[['label', 'message', 'cleaned_message']].head(5).to_dict(orient='records')
        return jsonify({
            "status": "success",
            "samples": len(cleaned_data),
            "preview": preview
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/preprocess_demo', methods=['POST'])
def handle_preprocess_demo():
    """Demos clean_text helper on customized text input."""
    data = request.json or {}
    text = data.get('text', '')
    if not text:
        return jsonify({"status": "error", "message": "No text provided"}), 400
    
    cleaned = clean_text(text)
    return jsonify({
        "raw": text,
        "cleaned": cleaned
    })

@app.route('/api/insights', methods=['GET'])
def get_insights():
    """Retrieves dataset distribution and top terms."""
    global cleaned_data
    if cleaned_data is None:
        return jsonify({"status": "error", "message": "Cleaned data not available"}), 400
    
    df = cleaned_data.copy()
    df['char_length'] = df['message'].apply(len)
    
    # Calculate stats
    label_counts = df['label'].value_counts().to_dict()
    ham_count = label_counts.get('ham', 0)
    spam_count = label_counts.get('spam', 0)
    
    avg_ham_len = float(df[df['label'] == 'ham']['char_length'].mean())
    avg_spam_len = float(df[df['label'] == 'spam']['char_length'].mean())
    
    # Common words
    spam_words = " ".join(df[df['label'] == 'spam']['cleaned_message']).split()
    ham_words = " ".join(df[df['label'] == 'ham']['cleaned_message']).split()
    
    top_spam = Counter(spam_words).most_common(15)
    top_ham = Counter(ham_words).most_common(15)
    
    # Length distributions (binned for chart display)
    ham_lengths = df[df['label'] == 'ham']['char_length'].tolist()
    spam_lengths = df[df['label'] == 'spam']['char_length'].tolist()
    
    return jsonify({
        "ham_count": int(ham_count),
        "spam_count": int(spam_count),
        "avg_ham_len": round(avg_ham_len, 2),
        "avg_spam_len": round(avg_spam_len, 2),
        "top_spam_words": top_spam,
        "top_ham_words": top_ham,
        "ham_lengths": ham_lengths,
        "spam_lengths": spam_lengths
    })

@app.route('/api/wordcloud/<label>', methods=['GET'])
def get_wordcloud(label):
    """Generates and serves WordCloud images on the fly."""
    global cleaned_data
    if cleaned_data is None:
        return "Cleaned data not loaded", 400
    
    if label not in ['spam', 'ham']:
        return "Invalid class label", 400
        
    if not WORDCLOUD_AVAILABLE:
        return "WordCloud library not available", 500
        
    text = " ".join(cleaned_data[cleaned_data['label'] == label]['cleaned_message'])
    if not text.strip():
        return "No text available for cloud", 400
        
    colormap = 'Reds' if label == 'spam' else 'Blues'
    wordcloud = WordCloud(width=600, height=400, background_color='white', colormap=colormap).generate(text)
    
    # Save to dynamic buffer
    img_buf = io.BytesIO()
    wordcloud.to_image().save(img_buf, format='PNG')
    img_buf.seek(0)
    
    return send_file(img_buf, mimetype='image/png')

@app.route('/api/train', methods=['POST'])
def handle_train():
    """Trains the classifier with custom hyperparameters."""
    global cleaned_data, trained_model, vectorizer, metrics, model_name
    if cleaned_data is None:
        return jsonify({"status": "error", "message": "Cleaned data not loaded"}), 400
        
    data = request.json or {}
    m_type = data.get('model_type', 'naive_bayes')
    max_feats = int(data.get('max_features', 3000))
    split_size = float(data.get('test_split', 20)) / 100.0
    
    try:
        model, vect, eval_metrics, _ = trainer.train_and_evaluate(
            cleaned_data,
            model_type=m_type,
            test_size=split_size,
            max_features=max_feats
        )
        
        # Cache in memory
        trained_model = model
        vectorizer = vect
        metrics = eval_metrics
        model_name = m_type
        
        # Save artifacts to file
        trainer.save_model_artifacts(model, vect, m_type)
        
        return jsonify({
            "status": "success",
            "model_name": m_type,
            "metrics": metrics
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/load_saved_model', methods=['POST'])
def handle_load_saved_model():
    """Loads pre-trained model pickled binaries from models/ folder."""
    global trained_model, vectorizer, model_name, metrics
    data = request.json or {}
    m_type = data.get('model_type', 'naive_bayes')
    
    try:
        model, vect = trainer.load_model_artifacts(m_type)
        trained_model = model
        vectorizer = vect
        model_name = m_type
        metrics = None  # Metrics are reset since we didn't run training live
        
        return jsonify({
            "status": "success",
            "model_name": m_type
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def handle_predict():
    """Predicts if a single message is Spam or Ham."""
    global trained_model, vectorizer
    if trained_model is None or vectorizer is None:
        return jsonify({"status": "error", "message": "No active model loaded or trained"}), 400
        
    data = request.json or {}
    message = data.get('message', '')
    if not message.strip():
        return jsonify({"status": "error", "message": "Message content empty"}), 400
        
    try:
        result = trainer.predict_message(
            message,
            trained_model,
            vectorizer,
            clean_text
        )
        
        # Generate word list breakdowns
        cleaned = clean_text(message)
        vocab = vectorizer.vocabulary_
        words_in_vocab = [w for w in cleaned.split() if w in vocab]
        words_not_in_vocab = [w for w in cleaned.split() if w not in vocab]
        
        result['words_in_vocab'] = words_in_vocab
        result['words_not_in_vocab'] = words_not_in_vocab
        result['cleaned_msg'] = cleaned
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Try importing webbrowser to open page on load
    import webbrowser
    from threading import Timer
    
    def open_browser():
        webbrowser.open_new("http://localhost:5000")
        
    # Launch browser after 1 second of server startup
    Timer(1.0, open_browser).start()
    
    app.run(host='0.0.0.0', port=5000, debug=True)
