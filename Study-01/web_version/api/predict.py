from http.server import BaseHTTPRequestHandler
import json
import base64
from PIL import Image
import io
import numpy as np
import tensorflow as tf
import os

# 모델 로드 (전역 변수로 한 번만 로드)
model = None

def load_model():
    global model
    if model is None:
        try:
            # Vercel 환경에서는 /var/task/api 경로에 파일이 있음
            model_path = os.path.join(os.path.dirname(__file__), 'MNIST_CNN.keras')
            model = tf.keras.models.load_model(model_path)
            print("Model loaded successfully from:", model_path)
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e
    return model

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 모델 로드
            model = load_model()

            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            # Get image data
            image_data = data['image']

            # Decode base64 image
            image_data = image_data.split(',')[1]
            image = Image.open(io.BytesIO(base64.b64decode(image_data)))

            # Convert to grayscale and resize
            image = image.convert('L')
            image = image.resize((28, 28), Image.Resampling.LANCZOS)

            # Convert to numpy array
            image_array = np.array(image)

            # Invert colors (white background -> black, black digit -> white)
            image_array = 255 - image_array

            # Normalize to [0, 1]
            image_array = image_array.astype('float32') / 255.0

            # Reshape for model input (1, 28, 28, 1)
            image_array = np.expand_dims(image_array, axis=-1)
            image_array = np.expand_dims(image_array, axis=0)

            # Make prediction
            predictions = model.predict(image_array, verbose=0)[0]

            # Get top 3 predictions
            top_indices = np.argsort(predictions)[::-1][:3]
            results = [
                {
                    'digit': int(idx),
                    'confidence': float(predictions[idx])
                }
                for idx in top_indices
            ]

            predictions = results

            # Return results
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {
                'success': True,
                'predictions': predictions
            }

            self.wfile.write(json.dumps(response).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {
                'success': False,
                'error': str(e)
            }

            self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
