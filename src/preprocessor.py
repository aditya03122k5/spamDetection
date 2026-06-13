import re
import nltk
import string
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# Initialize stemmer and ensure NLTK stopwords are downloaded
stemmer = PorterStemmer()

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Set of English stopwords
STOPWORDS = set(stopwords.words('english'))

def clean_text(text):
    """
    Cleans raw SMS message text by:
    1. Converting to lowercase.
    2. Removing HTML tags (if any).
    3. Removing URLs.
    4. Removing punctuation and special characters.
    5. Tokenizing and removing stopwords.
    6. Stemming words to their root forms.
    
    Args:
        text (str): The raw SMS message.
        
    Returns:
        str: The cleaned and preprocessed space-separated words.
    """
    if not isinstance(text, str):
        return ""
        
    # Convert to lowercase
    text = text.lower()
    
    # Remove HTML tags
    text = re.sub(r'<.*?>', '', text)
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove numbers and punctuation (replace with space to prevent joining words incorrectly)
    # Keeping only alphabets
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    
    # Tokenize by whitespace
    words = text.split()
    
    # Remove stopwords and stem remaining words
    cleaned_words = [stemmer.stem(word) for word in words if word not in STOPWORDS and len(word) > 1]
    
    # Rejoin words
    return " ".join(cleaned_words)

if __name__ == "__main__":
    # Test prepocessor
    sample_text = "Go until jurong point, crazy.. Available only in bugis n great world la e buffet... Cine there got amore wat..."
    print("Original:", sample_text)
    print("Cleaned :", clean_text(sample_text))
