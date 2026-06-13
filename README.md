# SMS Spam Predictor

A beautiful, interactive Machine Learning project to classify SMS messages as **Spam** or **Ham** (Legitimate).

This project features a fully end-to-end pipeline covering:
1. **Data loading** directly from the UCI Machine Learning Repository.
2. **Text Cleaning & Preprocessing** (conversion to lowercase, removal of special characters, word tokenization, stopword removal, and Porter Stemming).
3. **Exploratory Data Analysis (EDA)** (distribution of classes, message lengths, top words, and interactive Word Clouds).
4. **Model Training & Comparison** (Naive Bayes, Logistic Regression, and Random Forest) with evaluation metrics (Confusion Matrix, Precision/Recall, and ROC curve).
5. **Real-time SMS Classification Playground**.

---

## 📁 Project Structure

```text
sms_spam_predictor/
│
├── data/                       # Downloaded dataset directory
├── models/                     # Saved trained models and vectorizers (pickle)
├── src/                        # Core ML logic packages
│   ├── __init__.py
│   ├── data_loader.py          # Script to download and load data
│   ├── preprocessor.py         # Text preprocessing pipeline
│   └── model_trainer.py        # Model training and prediction functions
│
├── app.py                      # Interactive Streamlit Web UI
├── requirements.txt            # Project dependencies
└── README.md                   # Documentation
```

---

## 🚀 Installation & Running

### 1. Prerequisites
Make sure you have Python 3.8+ installed.

### 2. Run the Application
Start the Streamlit application using:
```bash
streamlit run app.py
```

This will spin up a beautiful, web-based dashboard on `http://localhost:8501` where you can interactively run the pipeline.
