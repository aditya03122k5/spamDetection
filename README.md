# 🛡️ SMS Spam Detector AI — End-to-End NLP Workspace

A premium, interactive Machine Learning workspace and web application to clean, analyze, train, and test spam classification models on SMS messages. Built with **Streamlit**, **Scikit-Learn**, and **NLTK**.

---

## 🌟 Key Features

1. **📂 Project Dashboard**: Overview of the NLP workspace lifecycle and system status check.
2. **🧹 Data Center**: Interactive data loading directly from the UCI Machine Learning Repository and real-time text preprocessing demo.
3. **📊 Insights (EDA)**: Dynamic visualizations including:
   * Class distribution donut charts (Ham vs. Spam ratio).
   * Character length distribution comparisons.
   * Top 15 most frequent words in Spam and Ham messages.
   * Interactive Word Clouds.
4. **🧪 Model Lab**: Custom training of different classifiers with live performance metrics:
   * **Accuracy**, **Precision**, **Recall**, and **F1-Score**.
   * Interactive **Confusion Matrix** heatmap.
   * **ROC Curve** plotting with Area Under Curve (AUC) score.
   * Classification reports.
5. **🎯 Predictor Playground**: Real-time SMS spam test playground with built-in templates (Normal, Spam, and Phishing) to test customized inputs.

---

## 🛠️ Tech Stack & Libraries Used

* **Interface & Dashboard**: [Streamlit](https://streamlit.io/) (for building the modern interactive web application)
* **Machine Learning**: [Scikit-Learn](https://scikit-learn.org/)
  * `TfidfVectorizer` (Term Frequency-Inverse Document Frequency text vectorization)
  * `MultinomialNB` (Naive Bayes Classifier)
  * `LogisticRegression` (Logistic Regression Classifier)
  * `RandomForestClassifier` (Random Forest Ensemble Classifier)
  * `train_test_split`, `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `confusion_matrix`, `roc_curve`, `auc`
* **Natural Language Processing (NLP)**: [NLTK (Natural Language Toolkit)](https://www.nltk.org/)
  * `stopwords` (filtering common English stopwords)
  * `PorterStemmer` (word tokenization and word stemming)
* **Data Processing & Analytics**:
  * [Pandas](https://pandas.pydata.org/) (DataFrames and text manipulation)
  * [NumPy](https://numpy.org/) (numerical computations)
* **Data Visualization**:
  * [Matplotlib](https://matplotlib.org/) (plot rendering)
  * [Seaborn](https://seaborn.pydata.org/) (confusion matrix and metric charts)
  * [WordCloud](https://github.com/amueller/word_cloud) (word cloud generation)
* **Serialization**: `pickle` (saving and loading trained models and vectorizers)

---

## 📈 Model Performance Benchmark

During test evaluation (with a 20% test split ratio and 3000 TF-IDF features), the models achieved the following performance metrics:

| Classifier | Accuracy | Precision (Spam) | Recall (Spam) | F1-Score |
| :--- | :--- | :--- | :--- | :--- |
| **Multinomial Naive Bayes** | **97.49%** | **99.19%** | 81.88% | 89.71% |
| **Logistic Regression** | **97.31%** | **98.35%** | 81.21% | 89.00% |
| **Random Forest** | **97.58%** | **99.20%** | 82.55% | 90.11% |

> [!TIP]
> **Why is Precision so important?** In spam filtering, a false positive (classifying a critical, legitimate personal message as spam) is far worse than a false negative (letting a spam message slip into the inbox). The Multinomial Naive Bayes model's **99.19% Precision** makes it a highly reliable candidate since it almost never misclassifies a real message as spam.

---

## 📁 Project Structure

```text
sms_spam_predictor/
│
├── src/                        # Core ML logic and pipeline scripts
│   ├── __init__.py
│   ├── data_loader.py          # Downloads, caches, and migrates the dataset
│   ├── preprocessor.py         # Text cleaning, stopword removal, and Porter Stemmer
│   ├── model_trainer.py        # Model training, evaluations, and prediction helpers
│   └── test_pipeline.py        # Offline pipeline test script
│
├── models/                     # Pickled model & vectorizer files (.pkl)
├── .gitignore                  # Git exclusions (ignores models, temp files, caches)
├── app.py                      # Premium interactive Streamlit Dashboard
├── requirements.txt            # Package dependencies
└── README.md                   # Project documentation (this file)
```

---

## 🚀 Installation & Setup

### 1. Prerequisites
Make sure you have **Python 3.8+** installed. You can verify this using:
```bash
python --version
```

### 2. Clone the Repository
```bash
git clone https://github.com/aditya03122k5/sms-spam-predictor.git
cd sms-spam-predictor
```

### 3. Install Dependencies
Install the required libraries:
```bash
pip install -r requirements.txt
```

### 4. Run the Dashboard
Launch the web interface locally:
```bash
streamlit run app.py
```

Open **`http://localhost:8501`** in your browser to explore the pipeline!

---

## 🧬 NLP & Preprocessing Details

Every raw SMS message goes through a 5-step preprocessing pipeline to normalize text before being converted into numeric TF-IDF features:
1. **Lowercasing**: The entire text is converted to lowercase.
2. **Link Stripping**: All web links and URLs (e.g., `http://...`) are stripped out.
3. **Punctuation Clean-up**: Special characters, numbers, and symbols are removed, keeping only letters.
4. **Stopwords Filtering**: Extremely frequent words that add no semantic meaning (e.g., *the, is, an, at*) are filtered out.
5. **Stemming (Porter Stemmer)**: Words are trimmed to their base root form (e.g., *winner*, *winning*, and *wins* all map to *win*).
