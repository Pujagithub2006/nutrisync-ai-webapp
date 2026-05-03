import sys
import os

# Force using Python 3.10
python_path = r'C:\Users\ASUS\AppData\Local\Programs\Python\Python310\python.exe'

print("Testing model load...")
try:
    import numpy as np
    print("✅ numpy imported")
except Exception as e:
    print(f"❌ numpy error: {e}")

try:
    from tensorflow.keras.models import load_model
    print("✅ tensorflow imported")
except Exception as e:
    print(f"❌ tensorflow error: {e}")

try:
    # Use the correct path to your model
    model = load_model('food_model.keras')
    print("✅ Model loaded successfully!")
    print(f"Model input shape: {model.input_shape}")
except Exception as e:
    print(f"❌ Model load error: {e}")