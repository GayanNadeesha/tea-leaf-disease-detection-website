from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import hashlib
import os
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploaded_images'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# MySQL Database Connection
db = mysql.connector.connect(
    host="localhost",
    user="root",      
    password="",      
    database="tea_leaf_db"
)
cursor = db.cursor()

# -------------------
# Load ML Model
# -------------------
MODEL_PATH = 'model.h5'
CLASS_NAMES = ['bird eye spot', 'brown blight', 'healthy', 'white spot']
IMG_SIZE = (224, 224)

try:
    model = keras.models.load_model(MODEL_PATH)
    print(f"✅ Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# -------------------
# Helper Functions
# -------------------
def preprocess_image(image_path):
    """Preprocess image for prediction"""
    try:
        img = Image.open(image_path).convert('RGB')
        img = img.resize(IMG_SIZE)
        img_array = np.array(img).astype('float32') / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"❌ Error preprocessing image: {e}")
        return None

def predict_disease(image_path):
    """Make prediction on the uploaded image"""
    if model is None:
        return {"error": "Model not loaded"}
    
    processed_img = preprocess_image(image_path)
    if processed_img is None:
        return {"error": "Image preprocessing failed"}
    
    try:
        predictions = model.predict(processed_img, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        predicted_class = CLASS_NAMES[predicted_class_idx]
        confidence = float(predictions[0][predicted_class_idx]) * 100
        
        # Get all class probabilities
        all_predictions = {
            CLASS_NAMES[i]: float(predictions[0][i]) * 100 
            for i in range(len(CLASS_NAMES))
        }
        
        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 2),
            "all_predictions": all_predictions
        }
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

# -------------------
# Signup Route
# -------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    fullname = data['fullname']
    email = data['email']
    phone = data['phone']
    password = data['password']

    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    try:
        cursor.execute(
            "INSERT INTO users (fullname, email, phone, password) VALUES (%s,%s,%s,%s)",
            (fullname, email, phone, hashed_password)
        )
        db.commit()
        return jsonify({"message": "Registration successful!"}), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

# -------------------
# Login Route
# -------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data['email']
    password = data['password']

    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s", (email, hashed_password))
    user = cursor.fetchone()

    if user:
        return jsonify({"message": "Login successful!"}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

# -------------------
# Upload and Predict endpoint
# -------------------
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Check file size
    filesize = len(file.read())
    file.seek(0)  # reset pointer

    if filesize > 3 * 1024 * 1024:
        return jsonify({"error": "Image size must be less than 3MB"}), 400

    # Save the file
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    # Make prediction
    prediction_result = predict_disease(filepath)
    
    if "error" in prediction_result:
        return jsonify(prediction_result), 400

    # Save to DB
    try:
        cursor.execute(
            "INSERT INTO uploaded_images (filename, filesize, predicted_class, confidence) VALUES (%s, %s, %s, %s)",
            (file.filename, filesize, prediction_result['predicted_class'], prediction_result['confidence'])
        )
        db.commit()
    except mysql.connector.Error as err:
        print(f"Database error: {err}")

    return jsonify({
        "message": "Image uploaded and analyzed successfully",
        "prediction": prediction_result
    }), 200

# -------------------
# Get prediction history
# -------------------
@app.route('/history', methods=['GET'])
def get_history():
    try:
        cursor.execute("SELECT filename, predicted_class, confidence, upload_date FROM uploaded_images ORDER BY upload_date DESC LIMIT 10")
        results = cursor.fetchall()
        
        history = []
        for row in results:
            history.append({
                "filename": row[0],
                "predicted_class": row[1],
                "confidence": row[2],
                "upload_date": str(row[3])
            })
        
        return jsonify({"history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# -------------------
# Run the Flask app
# -------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)