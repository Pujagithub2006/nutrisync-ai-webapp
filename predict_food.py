#!/usr/bin/env python3
"""
Food prediction script - called by Node.js backend
"""

import sys
import json
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

# Path to your model - UPDATE THIS PATH
MODEL_PATH = r'food_model.keras'

# YOUR 32 FOOD CLASSES - UPDATE THESE EXACTLY AS PER YOUR TRAINING
CLASS_NAMES = [
    'apple pie', 'biriyani', 'butter naan', 'carrot cake', 'chaat', 'chapati',
    'chicken curry', 'chocolate cake', 'cup cakes', 'dhokla', 'donuts', 'dosa',
    'french fries', 'fried rice', 'garlic bread', 'grilled cheese sandwich',
    'gulab jamun', 'halwa', 'hot dog', 'ice cream', 'idly', 'lobster roll sandwich',
    'medu vada', 'noodles', 'omelette', 'onion rings', 'pancakes', 'pizza',
    'poori', 'red velvet cake', 'samosa', 'spring rolls', 'strawberry shortcake',
    'tandoori chicken', 'upma', 'vada pav', 'waffles'
]

def load_model_once():
    """Load model once and cache it"""
    global _model
    if '_model' not in globals():
        _model = load_model(MODEL_PATH)
    return _model

def predict_food(image_path):
    """Predict food item from image path"""
    try:
        model = load_model_once()
        
        # Load and preprocess image
        img = image.load_img(image_path, target_size=(224, 224))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Predict
        predictions = model.predict(img_array, verbose=0)
        predicted_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_index])
        
        predicted_label = CLASS_NAMES[predicted_index]
        
        # Only return if confidence is reasonable
        if confidence < 0.3:
            return "unknown"
        
        return predicted_label
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return "unknown"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("unknown")
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = predict_food(image_path)
    print(result)