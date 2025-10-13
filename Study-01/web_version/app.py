from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow import keras
import numpy as np
import base64
from PIL import Image
import io
import cv2

app = Flask(__name__)
CORS(app)

class DigitRecognizer:
    def __init__(self):
        # Load and preprocess MNIST dataset
        (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
        self.x_train = x_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
        self.y_train = keras.utils.to_categorical(y_train, 10)
        self.x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0
        self.y_test = keras.utils.to_categorical(y_test, 10)
        
        # Build and train model
        self.model = self.build_model()
        self.train_model()
    
    def build_model(self):
        model = keras.Sequential([
            keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Conv2D(64, (3, 3), activation='relu'),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Flatten(),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(128, activation='relu'),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(10, activation='softmax')
        ])
        
        model.compile(optimizer='adam',
                     loss='categorical_crossentropy',
                     metrics=['accuracy'])
        return model
    
    def train_model(self):
        print("Training model...")
        self.model.fit(self.x_train, self.y_train, 
                      epochs=5, batch_size=128, 
                      validation_split=0.1, verbose=1)
        test_loss, test_acc = self.model.evaluate(self.x_test, self.y_test, verbose=0)
        print(f"Test accuracy: {test_acc:.4f}")
    
    def predict_digit(self, image_data):
        # Decode base64 image
        image_data = image_data.split(',')[1]
        image = Image.open(io.BytesIO(base64.b64decode(image_data)))
        
        # Convert to grayscale and resize
        image = image.convert('L')
        image = image.resize((28, 28), Image.Resampling.LANCZOS)
        
        # Convert to numpy array and preprocess
        img_array = np.array(image)
        img_array = 255 - img_array  # Invert colors
        img_array = img_array.astype('float32') / 255.0
        img_array = img_array.reshape(1, 28, 28, 1)
        
        # Make prediction
        predictions = self.model.predict(img_array, verbose=0)
        predictions = predictions[0]
        
        # Get top 3 predictions
        top_indices = np.argsort(predictions)[-3:][::-1]
        results = []
        for idx in top_indices:
            results.append({
                'digit': int(idx),
                'confidence': float(predictions[idx])
            })
        
        return results

# Initialize model
print("Initializing digit recognizer...")
recognizer = DigitRecognizer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        image_data = data['image']
        predictions = recognizer.predict_digit(image_data)
        return jsonify({'success': True, 'predictions': predictions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)