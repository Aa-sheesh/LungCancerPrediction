from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the trained model (ensure lung_cancer_model.h5 is in the project root)
model = load_model('lung_cancer_model.h5')

# Class names (order must match your training labels)
class_names = ['Normal', 'Adenocarcinoma', 'Squamous', 'Large cell carcinoma']

def preprocess_image(image, target_size=(224, 224)):
    if image.mode != "RGB":
        image = image.convert("RGB")
    image = image.resize(target_size)
    image = np.array(image).astype("float32") / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    try:
        image = Image.open(file.stream)
    except Exception as e:
        return jsonify({'error': 'Invalid image format'}), 400

    processed_image = preprocess_image(image)
    prediction = model.predict(processed_image)
    pred_index = np.argmax(prediction, axis=1)[0]
    pred_confidence = float(np.max(prediction))
    pred_class = class_names[pred_index]

    return jsonify({
        'class': pred_class,
        'confidence': pred_confidence,
        'probabilities': prediction[0].tolist()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
