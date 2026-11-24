import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from collections import Counter
import string

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def preprocess_text(text: str) -> str:
    """
    Clean and preprocess text for ML model.
    """
    # Convert to lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    
    # Remove HTML tags
    text = re.sub(r'<.*?>', '', text)
    
    # Remove punctuation and digits
    text = re.sub(f'[{re.escape(string.punctuation)}0-9]', '', text)
    
    # Remove extra whitespaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Tokenize
    tokens = word_tokenize(text)
    
    # Remove stopwords and lemmatize
    tokens = [lemmatizer.lemmatize(token) for token in tokens if token not in stop_words and len(token) > 2]
    
    # Join back
    processed = ' '.join(tokens)
    
    return processed

def extract_keywords(text: str, top_n: int = 5) -> list:
    """
    Extract important keywords from text using frequency.
    Filters out common journalistic filler words.
    """
    # Clean text
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(f'[{re.escape(string.punctuation)}0-9]', ' ', text)
    
    # Tokenize
    tokens = word_tokenize(text)
    
    # Extended stop words
    extra_stops = {'said', 'would', 'could', 'also', 'one', 'two', 'new', 'time', 'like', 'many', 'get', 'make', 'even', 'much'}
    all_stops = stop_words.union(extra_stops)
    
    # Filter stopwords and short words
    tokens = [lemmatizer.lemmatize(token) for token in tokens if token not in all_stops and len(token) > 3]
    
    # Count frequencies
    word_freq = Counter(tokens)
    
    # Get top N
    keywords = [word for word, _ in word_freq.most_common(top_n)]
    
    return keywords

def remove_data_leakage(text: str) -> str:
    """
    Remove publisher signatures and known data leakage markers from the ISOT dataset
    so the model learns linguistic features instead of just looking for 'Reuters'.
    """
    import re
    # Remove standard Reuters intro
    text = re.sub(r'^.*?\(Reuters\) - ', '', text, flags=re.IGNORECASE)
    # Remove standalone reuters
    text = re.sub(r'\breuters\b', '', text, flags=re.IGNORECASE)
    # Remove other common artifacts
    text = re.sub(r'featured image', '', text, flags=re.IGNORECASE)
    text = re.sub(r'getty images', '', text, flags=re.IGNORECASE)
    text = re.sub(r'pic\.twitter\.com\S+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\bbreitbart\b', '', text, flags=re.IGNORECASE)
    return text