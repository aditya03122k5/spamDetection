import os
import urllib.request
import zipfile
import pandas as pd

DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip"
# Store in user's home directory so the dataset is only downloaded once per system/user
DATA_DIR = os.path.join(os.path.expanduser("~"), ".sms_spam_detector_data")
ZIP_PATH = os.path.join(DATA_DIR, "smsspamcollection.zip")
FILE_PATH = os.path.join(DATA_DIR, "SMSSpamCollection")

def download_and_extract():
    """
    Downloads the SMS Spam Collection dataset and extracts it to a system-wide user directory.
    If the data is found in the old local project directory, it migrates it automatically.
    """
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Created directory: {DATA_DIR}")
        
    if not os.path.exists(FILE_PATH):
        # Migration path: Check if dataset is in the old project data folder
        old_data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
        old_file_path = os.path.join(old_data_dir, "SMSSpamCollection")
        old_readme_path = os.path.join(old_data_dir, "readme")
        
        if os.path.exists(old_file_path):
            print("Migrating dataset from old local folder to system-wide location...")
            import shutil
            try:
                shutil.copy(old_file_path, FILE_PATH)
                if os.path.exists(old_readme_path):
                    shutil.copy(old_readme_path, os.path.join(DATA_DIR, "readme"))
                print("Migration complete. Dataset stored at:", FILE_PATH)
                return
            except Exception as e:
                print(f"Failed to migrate from old path: {e}")
                
        # If no migration source, download it
        print(f"Downloading dataset from {DATA_URL}...")
        try:
            # Download zip file
            urllib.request.urlretrieve(DATA_URL, ZIP_PATH)
            print("Download complete. Extracting file...")
            
            # Extract zip file
            with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
                zip_ref.extractall(DATA_DIR)
            print("Extraction complete.")
            
            # Clean up zip file
            os.remove(ZIP_PATH)
            print("Temporary zip file removed.")
        except Exception as e:
            print(f"Error downloading or extracting dataset: {e}")
            raise e
    else:
        print("Dataset already exists locally in system-wide directory.")

def load_data():
    """
    Loads the SMS Spam Collection dataset into a Pandas DataFrame.
    """
    # Ensure dataset is downloaded and extracted
    download_and_extract()
    
    # Load dataset (tab-separated, no header)
    try:
        df = pd.read_csv(FILE_PATH, sep='\t', names=['label', 'message'], encoding='utf-8')
        print(f"Dataset loaded successfully. Shape: {df.shape}")
        return df
    except Exception as e:
        print(f"Error loading dataset: {e}")
        raise e

if __name__ == "__main__":
    # Test script
    df = load_data()
    print(df.head())
