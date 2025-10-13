from http.server import BaseHTTPRequestHandler
import json
import base64
import numpy as np
from PIL import Image
import io

# Simple MNIST prediction using a lightweight approach
# For demonstration, we'll use a simple pattern matching approach
# In production, you would load a pre-trained model

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
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
            img_array = np.array(image)
            img_array = 255 - img_array  # Invert colors

            # Simple prediction based on pixel density in regions
            # This is a lightweight alternative for demo purposes
            predictions = self.simple_predict(img_array)

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

    def simple_predict(self, img_array):
        """
        Simple heuristic-based prediction for demonstration
        In production, replace with actual model prediction
        """
        # Normalize
        img_norm = img_array.astype('float32') / 255.0

        # Calculate features
        top_density = np.mean(img_norm[:10, :])
        middle_density = np.mean(img_norm[9:19, :])
        bottom_density = np.mean(img_norm[18:, :])
        left_density = np.mean(img_norm[:, :10])
        right_density = np.mean(img_norm[:, 18:])
        center_density = np.mean(img_norm[9:19, 9:19])

        # Simple pattern matching
        scores = np.zeros(10)

        # These are rough heuristics - replace with actual model
        if center_density > 0.3:
            scores[0] = 0.7 + np.random.rand() * 0.2  # likely 0
            scores[8] = 0.5 + np.random.rand() * 0.2  # could be 8

        if top_density < 0.2 and bottom_density > 0.3:
            scores[1] = 0.6 + np.random.rand() * 0.3  # likely 1
            scores[7] = 0.4 + np.random.rand() * 0.2  # could be 7

        # Add some randomness for other digits
        for i in range(10):
            if scores[i] == 0:
                scores[i] = np.random.rand() * 0.3

        # Normalize scores to sum to ~1
        scores = scores / scores.sum()

        # Get top 3
        top_indices = np.argsort(scores)[-3:][::-1]
        results = []
        for idx in top_indices:
            results.append({
                'digit': int(idx),
                'confidence': float(scores[idx])
            })

        return results
