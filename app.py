import streamlit as st
import pandas as pd
import numpy as np
import os
import sys
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter

# Add src folder to python path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from data_loader import load_data, download_and_extract
from preprocessor import clean_text
import model_trainer as trainer

# Set page configuration with custom title and emoji
st.set_page_config(
    page_title="SMS Spam Detector AI",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Premium Styling using CSS
st.markdown("""
<style>
    /* Gradient Background for Header */
    .header-container {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        padding: 2.5rem;
        border-radius: 12px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .header-container h1 {
        font-family: 'Outfit', 'Inter', sans-serif;
        font-size: 2.8rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -0.5px;
    }
    .header-container p {
        font-size: 1.1rem;
        opacity: 0.9;
        margin-top: 0.5rem;
        font-weight: 300;
    }
    
    /* Premium Cards */
    .metric-card {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        padding: 1.5rem;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    
    .metric-title {
        font-size: 0.9rem;
        color: #6c757d;
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 0.3rem;
    }
    .metric-value {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1e3c72;
    }
    
    /* Result Banners */
    .spam-banner {
        background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 10px;
        text-align: center;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(255, 75, 43, 0.2);
    }
    .ham-banner {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 10px;
        text-align: center;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(56, 239, 125, 0.2);
    }
</style>
""", unsafe_allow_html=True)

# Try importing WordCloud, handle fallback gracefully
WORDCLOUD_AVAILABLE = False
try:
    from wordcloud import WordCloud
    WORDCLOUD_AVAILABLE = True
except ImportError:
    pass

# Initialize session states to persist loaded data and trained models
if 'raw_data' not in st.session_state:
    st.session_state.raw_data = None
if 'cleaned_data' not in st.session_state:
    st.session_state.cleaned_data = None
if 'trained_model' not in st.session_state:
    st.session_state.trained_model = None
if 'vectorizer' not in st.session_state:
    st.session_state.vectorizer = None
if 'metrics' not in st.session_state:
    st.session_state.metrics = None
if 'model_name' not in st.session_state:
    st.session_state.model_name = None

# Sidebar layout
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/561/561127.png", width=80)
    st.title("Settings & Control")
    st.write("Orchestrate the Machine Learning pipeline from this panel.")
    st.markdown("---")
    
    # Select Model Hyperparameters
    st.subheader("Model Configuration")
    selected_model_type = st.selectbox(
        "Choose Classifier Model",
        options=['naive_bayes', 'logistic_regression', 'random_forest'],
        format_func=lambda x: "Multinomial Naive Bayes" if x == 'naive_bayes' else ("Logistic Regression" if x == 'logistic_regression' else "Random Forest")
    )
    
    tfidf_max_features = st.slider(
        "TF-IDF Max Features",
        min_value=500,
        max_value=5000,
        value=3000,
        step=500,
        help="The maximum number of vocabulary features to build."
    )
    
    test_split_ratio = st.slider(
        "Test Split Size (%)",
        min_value=10,
        max_value=40,
        value=20,
        step=5
    )
    
    st.markdown("---")
    st.caption("Developed by Antigravity Assistant © 2026")

# Header Section
st.markdown("""
<div class="header-container">
    <h1>🛡️ SMS Spam Detector AI</h1>
    <p>An interactive Machine Learning workspace to clean, analyze, train, and test spam classification models.</p>
</div>
""", unsafe_allow_html=True)

# Main Navigation Tabs
tab_overview, tab_data, tab_eda, tab_model, tab_playground = st.tabs([
    "📂 Project Overview", 
    "🧹 Data Center", 
    "📊 Insights (EDA)", 
    "🧪 Model Lab", 
    "🎯 SMS Predictor Playground"
])

# ----------------- TAB 1: OVERVIEW -----------------
with tab_overview:
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("Welcome to the SMS Spam Detector Dashboard")
        st.write("""
        This interactive workspace allows you to run, visualize, and understand an entire text classification NLP pipeline.
        SMS spam (sometimes called *mishing* or mobile phishing) is a major cybersecurity issue. 
        Applying Machine Learning classifiers allows us to filter these messages with near 98%+ accuracy.
        """)
        
        st.markdown("""
        ### ⚡ Project Life Cycle
        * **1. Data Center:** Load the SMS Spam Collection dataset, view raw texts, and perform text cleaning.
        * **2. Insights (EDA):** Discover statistical trends, word frequencies, and character length differentials between spam and ham.
        * **3. Model Lab:** Train classifier models, view precision/recall, examine the confusion matrix, and analyze ROC Curves.
        * **4. SMS Predictor:** Enter your own custom text to test the system in real time!
        """)
        
        st.info("💡 **Ready to begin?** Head over to the **Data Center** tab to load the dataset!")

    with col2:
        st.subheader("System Status")
        if st.session_state.raw_data is None:
            st.warning("⚠️ Dataset: Not Loaded")
        else:
            st.success(f"✅ Dataset: Loaded ({len(st.session_state.raw_data)} samples)")
            
        if st.session_state.trained_model is None:
            st.warning("⚠️ Model: Untrained")
        else:
            st.success(f"✅ Model: Trained ({st.session_state.model_name})")

# ----------------- TAB 2: DATA CENTER -----------------
with tab_data:
    st.subheader("1. Data Loading & Extraction")
    
    load_col1, load_col2 = st.columns([1, 2])
    with load_col1:
        st.write("Download the dataset from the official UCI repository and load it into memory.")
        if st.button("Download & Load SMS Dataset", type="primary"):
            with st.spinner("Downloading dataset and extracting zip..."):
                try:
                    df = load_data()
                    st.session_state.raw_data = df
                    st.success("Dataset loaded successfully!")
                except Exception as e:
                    st.error(f"Failed to load dataset: {e}")
                    
    with load_col2:
        if st.session_state.raw_data is not None:
            st.dataframe(st.session_state.raw_data.head(10), use_container_width=True)
            st.caption(f"Showing the first 10 rows of {len(st.session_state.raw_data)} rows.")

    st.markdown("---")
    st.subheader("2. Text Cleaning & Preprocessing")
    st.write("""
    Raw messages contain HTML tags, punctuation, special symbols, stopwords, and varying word tenses.
    Our preprocessing pipeline cleans and transforms the raw text into standard root words (stems):
    """)
    
    pre_col1, pre_col2 = st.columns(2)
    with pre_col1:
        st.markdown("""
        **Preprocessing Steps:**
        1. **Lowercasing:** Standardize all words to lower case.
        2. **URL/HTML removal:** Strips out web links and HTML syntax.
        3. **Non-alphabetic character cleaning:** Remove punctuation, special characters, and digits.
        4. **Stopword Removal:** Eliminates highly frequent words that carry little semantic information (e.g. 'the', 'is', 'at').
        5. **Porter Stemming:** Reduces words to their core base forms (e.g., 'running', 'runs', 'ran' all become 'run').
        """)
        
        if st.session_state.raw_data is not None:
            if st.button("Run Cleaning on Entire Dataset", type="primary"):
                with st.spinner("Processing texts (Cleaning, stopword removal, and stemming)..."):
                    df = st.session_state.raw_data.copy()
                    df['cleaned_message'] = df['message'].apply(clean_text)
                    st.session_state.cleaned_data = df
                    st.success("Text cleaning pipeline complete!")
        else:
            st.warning("Please download and load the dataset first.")
            
    with pre_col2:
        st.markdown("**Preprocessing Demo:**")
        test_demo_text = st.text_input(
            "Type a raw sentence to see the preprocessing output:",
            value="Urgent! Call 09061701461 from landline. 2k bonus prize. Claim code: WY39. Standard rates apply."
        )
        if test_demo_text:
            cleaned_demo = clean_text(test_demo_text)
            st.markdown(f"**Raw Text:** `{test_demo_text}`")
            st.markdown(f"**Cleaned Text:** `{cleaned_demo}`")

    if st.session_state.cleaned_data is not None:
        st.markdown("### Cleaned Dataset Preview")
        st.dataframe(st.session_state.cleaned_data[['label', 'message', 'cleaned_message']].head(5), use_container_width=True)

# ----------------- TAB 3: INSIGHTS (EDA) -----------------
with tab_eda:
    st.subheader("Exploratory Data Analysis")
    if st.session_state.cleaned_data is None:
        st.warning("⚠️ Please load and clean the dataset in the **Data Center** tab to see visualizations.")
    else:
        df = st.session_state.cleaned_data
        
        # Calculate stats
        df['char_length'] = df['message'].apply(len)
        df['word_count'] = df['message'].apply(lambda x: len(x.split()))
        
        # Row 1: Basic distributions
        eda_col1, eda_col2 = st.columns(2)
        
        with eda_col1:
            st.markdown("#### Class Distribution (Ham vs. Spam)")
            fig, ax = plt.subplots(figsize=(6, 4.5))
            colors = ['#1e3c72', '#ff416c']
            label_counts = df['label'].value_counts()
            
            # Donut chart
            ax.pie(
                label_counts, 
                labels=label_counts.index, 
                autopct='%1.1f%%', 
                startangle=90, 
                colors=colors,
                wedgeprops=dict(width=0.4, edgecolor='w')
            )
            ax.set_title("SMS Type Ratio in Dataset")
            st.pyplot(fig)
            
            # Print class count details
            st.write(f"**Ham (Legitimate) messages:** {label_counts.get('ham', 0)} ({label_counts.get('ham', 0)/len(df)*100:.1f}%)")
            st.write(f"**Spam (Scam) messages:** {label_counts.get('spam', 0)} ({label_counts.get('spam', 0)/len(df)*100:.1f}%)")
            
        with eda_col2:
            st.markdown("#### Message Length Distribution")
            fig, ax = plt.subplots(figsize=(7, 4.5))
            
            sns.histplot(
                data=df, 
                x='char_length', 
                hue='label', 
                bins=50, 
                kde=True, 
                palette={'ham': '#1e3c72', 'spam': '#ff416c'},
                ax=ax,
                multiple="stack"
            )
            ax.set_xlim(0, 300)
            ax.set_xlabel("Message Character Length")
            ax.set_ylabel("Count")
            ax.set_title("Message Length Comparison (Spam vs. Ham)")
            st.pyplot(fig)
            
            # Print average length comparisons
            avg_ham_len = df[df['label']=='ham']['char_length'].mean()
            avg_spam_len = df[df['label']=='spam']['char_length'].mean()
            st.write(f"**Average Ham Length:** {avg_ham_len:.1f} characters")
            st.write(f"**Average Spam Length:** {avg_spam_len:.1f} characters")
            st.info("💡 **Key Insight:** Spam messages are statistically much longer on average than legitimate messages.")

        st.markdown("---")
        
        # Row 2: Most Common Words & Wordclouds
        eda_col3, eda_col4 = st.columns(2)
        
        with eda_col3:
            st.markdown("#### Top 15 Words in Spam Messages")
            spam_words = " ".join(df[df['label']=='spam']['cleaned_message']).split()
            spam_word_counts = Counter(spam_words).most_common(15)
            
            if spam_word_counts:
                spam_word_df = pd.DataFrame(spam_word_counts, columns=['Word', 'Count'])
                fig, ax = plt.subplots(figsize=(6, 4.5))
                sns.barplot(data=spam_word_df, y='Word', x='Count', color='#ff416c', ax=ax)
                ax.set_title("Most Common Words in Spam SMS")
                st.pyplot(fig)
            else:
                st.write("No words to analyze.")
                
        with eda_col4:
            st.markdown("#### Top 15 Words in Ham Messages")
            ham_words = " ".join(df[df['label']=='ham']['cleaned_message']).split()
            ham_word_counts = Counter(ham_words).most_common(15)
            
            if ham_word_counts:
                ham_word_df = pd.DataFrame(ham_word_counts, columns=['Word', 'Count'])
                fig, ax = plt.subplots(figsize=(6, 4.5))
                sns.barplot(data=ham_word_df, y='Word', x='Count', color='#1e3c72', ax=ax)
                ax.set_title("Most Common Words in Ham SMS")
                st.pyplot(fig)
            else:
                st.write("No words to analyze.")

        st.markdown("---")
        st.markdown("#### Visual Word Clouds")
        
        if WORDCLOUD_AVAILABLE:
            wc_col1, wc_col2 = st.columns(2)
            
            with wc_col1:
                st.markdown("**Spam Word Cloud**")
                spam_txt = " ".join(df[df['label']=='spam']['cleaned_message'])
                if spam_txt.strip():
                    wordcloud_spam = WordCloud(width=600, height=400, background_color='white', colormap='Reds').generate(spam_txt)
                    fig, ax = plt.subplots(figsize=(8, 5))
                    ax.imshow(wordcloud_spam, interpolation='bilinear')
                    ax.axis('off')
                    st.pyplot(fig)
                else:
                    st.write("Empty text.")
                    
            with wc_col2:
                st.markdown("**Ham Word Cloud**")
                ham_txt = " ".join(df[df['label']=='ham']['cleaned_message'])
                if ham_txt.strip():
                    wordcloud_ham = WordCloud(width=600, height=400, background_color='white', colormap='Blues').generate(ham_txt)
                    fig, ax = plt.subplots(figsize=(8, 5))
                    ax.imshow(wordcloud_ham, interpolation='bilinear')
                    ax.axis('off')
                    st.pyplot(fig)
                else:
                    st.write("Empty text.")
        else:
            st.warning("⚠️ `wordcloud` library is not currently installed or failed to load. Displaying text fallback.")
            st.write("**Top Spam Words:** " + ", ".join([w[0] for w in spam_word_counts]))
            st.write("**Top Ham Words:** " + ", ".join([w[0] for w in ham_word_counts]))

# ----------------- TAB 4: MODEL LAB -----------------
with tab_model:
    st.subheader("Model Training & Evaluation")
    
    if st.session_state.cleaned_data is None:
        st.warning("⚠️ Please load and clean the dataset in the **Data Center** tab before training.")
    else:
        st.write("Fine-tune configurations on the sidebar, then run the trainer.")
        
        train_btn_col1, train_btn_col2 = st.columns([1, 4])
        with train_btn_col1:
            if st.button("⚡ Run Model Training", type="primary"):
                with st.spinner(f"Training {selected_model_type.upper()} model..."):
                    # Execute training
                    model, vectorizer, metrics, data_split = trainer.train_and_evaluate(
                        st.session_state.cleaned_data,
                        model_type=selected_model_type,
                        test_size=test_split_ratio/100.0,
                        max_features=tfidf_max_features
                    )
                    
                    # Store variables in session state
                    st.session_state.trained_model = model
                    st.session_state.vectorizer = vectorizer
                    st.session_state.metrics = metrics
                    st.session_state.model_name = selected_model_type
                    
                    # Save artifacts to folder
                    trainer.save_model_artifacts(model, vectorizer, selected_model_type)
                    st.success("Model trained and serialized successfully!")
                    
        with train_btn_col2:
            st.caption("Training will split the dataset into Train/Test subsets, transform them using TF-IDF Vectorization, train the selected Classifier, and compute performance scores.")
            
        if st.session_state.trained_model is not None and st.session_state.metrics is not None:
            st.markdown("---")
            st.subheader(f"📊 Training Results: {st.session_state.model_name.upper()}")
            
            # Displays Metric Cards
            m = st.session_state.metrics
            col_m1, col_m2, col_m3, col_m4 = st.columns(4)
            
            with col_m1:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-title">Accuracy</div>
                    <div class="metric-value">{m['accuracy']*100:.2f}%</div>
                </div>
                """, unsafe_allow_html=True)
            with col_m2:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-title">Precision</div>
                    <div class="metric-value">{m['precision']*100:.2f}%</div>
                </div>
                """, unsafe_allow_html=True)
            with col_m3:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-title">Recall</div>
                    <div class="metric-value">{m['recall']*100:.2f}%</div>
                </div>
                """, unsafe_allow_html=True)
            with col_m4:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-title">F1-Score</div>
                    <div class="metric-value">{m['f1_score']*100:.2f}%</div>
                </div>
                """, unsafe_allow_html=True)
                
            st.markdown("---")
            
            # Confusion Matrix and ROC Curve side by side
            plot_col1, plot_col2 = st.columns(2)
            
            with plot_col1:
                st.markdown("#### Confusion Matrix")
                cm = np.array(m['confusion_matrix'])
                fig, ax = plt.subplots(figsize=(5, 4))
                sns.heatmap(
                    cm, 
                    annot=True, 
                    fmt="d", 
                    cmap="Blues", 
                    xticklabels=['Ham', 'Spam'], 
                    yticklabels=['Ham', 'Spam'],
                    ax=ax,
                    cbar=False
                )
                ax.set_xlabel("Predicted Label")
                ax.set_ylabel("True Label")
                st.pyplot(fig)
                st.caption("A higher diagonal value (top-left, bottom-right) represents correct predictions. Top-Right is False Positives, Bottom-Left is False Negatives.")
                
            with plot_col2:
                st.markdown("#### ROC Curve (Receiver Operating Characteristic)")
                roc = m['roc_curve']
                fig, ax = plt.subplots(figsize=(5, 4))
                ax.plot(roc['fpr'], roc['tpr'], color='#ff416c', lw=2, label=f"ROC Curve (AUC = {roc['auc']:.4f})")
                ax.plot([0, 1], [0, 1], color='#1e3c72', lw=1, linestyle='--')
                ax.set_xlabel("False Positive Rate")
                ax.set_ylabel("True Positive Rate")
                ax.set_title("ROC Curve")
                ax.legend(loc="lower right")
                st.pyplot(fig)
                st.caption("The closer the curve clings to the top-left corner, the more powerful the model is at separating spam from ham.")
                
            st.markdown("---")
            st.markdown("#### Classification Report Details")
            report_df = pd.DataFrame(m['classification_report']).transpose()
            st.dataframe(report_df.style.highlight_max(axis=0, color='#e6f2ff'), use_container_width=True)

# ----------------- TAB 5: PLAYGROUND -----------------
with tab_playground:
    st.subheader("🎯 Real-Time SMS Spam Prediction")
    st.write("Deploy the model into a test sandbox. Type in any message and run inference.")
    
    # Check if a model is trained, else try to load a default saved one
    if st.session_state.trained_model is None:
        # Check if files already exist on disk
        model_path = os.path.join(trainer.MODELS_DIR, f"{selected_model_type}_model.pkl")
        vectorizer_path = os.path.join(trainer.MODELS_DIR, f"{selected_model_type}_vectorizer.pkl")
        
        if os.path.exists(model_path) and os.path.exists(vectorizer_path):
            if st.button("Retrieve Last Saved Model from Disk", type="primary"):
                with st.spinner("Loading pickled model artifacts..."):
                    try:
                        model, vectorizer = trainer.load_model_artifacts(selected_model_type)
                        st.session_state.trained_model = model
                        st.session_state.vectorizer = vectorizer
                        st.session_state.model_name = selected_model_type
                        st.success(f"Successfully loaded saved {selected_model_type} model!")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error loading artifacts: {e}")
        else:
            st.warning("⚠️ No active model found. Please go to the **Model Lab** tab and train a model first.")
            
    if st.session_state.trained_model is not None:
        input_message = st.text_area(
            "Enter SMS message content to classify:",
            placeholder="Type your message here...",
            height=120
        )
        
        # Quick template buttons
        st.markdown("**Try a Template Example:**")
        t_col1, t_col2, t_col3 = st.columns(3)
        with t_col1:
            if st.button("Normal Message (Ham)"):
                input_message = "Hey buddy, are we still meeting for lunch today at 1 PM? Let me know."
                st.rerun()
        with t_col2:
            if st.button("Spam Message (Promo/Scam)"):
                input_message = "URGENT! Your mobile number has won a £2,000 prize! To claim text CLAIM to 81010. Terms apply. Free msg."
                st.rerun()
        with t_col3:
            if st.button("Deceptive Spam (Phishing)"):
                input_message = "Dear customer, your Bank account has been locked due to suspicious activity. Visit https://secure-bank-login.com to unlock."
                st.rerun()
                
        if st.button("🛡️ Classify SMS", type="primary"):
            if input_message.strip() == "":
                st.warning("Please type a message first.")
            else:
                with st.spinner("Classifying message..."):
                    result = trainer.predict_message(
                        input_message,
                        st.session_state.trained_model,
                        st.session_state.vectorizer,
                        clean_text
                    )
                    
                    st.markdown("---")
                    st.subheader("Prediction Result")
                    
                    # Display label banner
                    if result['label'] == 'spam':
                        st.markdown(f"""
                        <div class="spam-banner">
                            <h2>⚠️ CLASSIFIED AS SPAM</h2>
                            <p>Confidence score: {result['spam_probability']*100:.2f}%</p>
                        </div>
                        """, unsafe_allow_html=True)
                    else:
                        st.markdown(f"""
                        <div class="ham-banner">
                            <h2>✅ CLASSIFIED AS HAM (LEGITIMATE)</h2>
                            <p>Confidence score: {result['ham_probability']*100:.2f}%</p>
                        </div>
                        """, unsafe_allow_html=True)
                        
                    st.write("")
                    
                    # Probabilities breakdown
                    p_col1, p_col2 = st.columns(2)
                    with p_col1:
                        st.markdown("#### Probability Distribution")
                        prob_df = pd.DataFrame({
                            'Class': ['Ham (Legitimate)', 'Spam (Scam)'],
                            'Probability (%)': [result['ham_probability']*100, result['spam_probability']*100]
                        })
                        
                        fig, ax = plt.subplots(figsize=(5, 3))
                        sns.barplot(
                            data=prob_df, 
                            x='Probability (%)', 
                            y='Class', 
                            palette=['#11998e', '#ff416c'],
                            ax=ax
                        )
                        ax.set_xlim(0, 100)
                        st.pyplot(fig)
                        
                    with p_col2:
                        st.markdown("#### Text Cleaning & Feature Breakdown")
                        cleaned = clean_text(input_message)
                        st.write(f"**Cleaned SMS:** `{cleaned}`")
                        
                        # Show which words in the text are in the TF-IDF vocabulary
                        vocab = st.session_state.vectorizer.vocabulary_
                        words_in_vocab = [w for w in cleaned.split() if w in vocab]
                        words_not_in_vocab = [w for w in cleaned.split() if w not in vocab]
                        
                        st.write("**Key words driving prediction:**")
                        if words_in_vocab:
                            st.write(", ".join([f"`{w}`" for w in words_in_vocab]))
                        else:
                            st.write("None (the words in the message are not in the vocabulary).")
                            
                        if words_not_in_vocab:
                            st.caption(f"Words ignored (not in dictionary): {', '.join(words_not_in_vocab)}")
