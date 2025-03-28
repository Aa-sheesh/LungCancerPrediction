# %%writefile app.py
from flask import Flask, request, jsonify, render_template
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io

app = Flask(__name__)

# Load the trained model
model = load_model('lung_cancer_model.h5')

# Define your class names (ensure the order matches your training)
class_names = ['Normal', 'Adenocarcinoma', 'Squamous', 'Large cell carcinoma']

def preprocess_image(image, target_size=(224, 224)):
    # Ensure image is RGB
    if image.mode != "RGB":
        image = image.convert("RGB")
    # Resize and normalize the image
    image = image.resize(target_size)
    image = np.array(image).astype("float32") / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@app.route('/')
def index():
    # Serve a simple template (you can create a templates/index.html later)
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
    # For development, use debug=True. For production, use a proper WSGI server.
    app.run(debug=True)
