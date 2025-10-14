from http.server import BaseHTTPRequestHandler
import json
import base64
from PIL import Image
import io
import random

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

            # Get pixel data
            pixels = list(image.getdata())

            # Invert colors
            pixels = [255 - p for p in pixels]

            # Simple prediction based on pixel density in regions
            predictions = self.simple_predict(pixels)

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

    def simple_predict(self, pixels):
        """
        Simple heuristic-based prediction for demonstration
        This is a lightweight demo - in production, use a real ML model
        """
        # Calculate region densities (28x28 image)
        def get_region_density(pixels, rows, cols):
            total = sum(pixels[r * 28 + c] for r in rows for c in cols)
            return total / (len(rows) * len(cols) * 255.0)

        top_density = get_region_density(pixels, range(0, 10), range(0, 28))
        middle_density = get_region_density(pixels, range(9, 19), range(0, 28))
        bottom_density = get_region_density(pixels, range(18, 28), range(0, 28))
        left_density = get_region_density(pixels, range(0, 28), range(0, 10))
        right_density = get_region_density(pixels, range(0, 28), range(18, 28))
        center_density = get_region_density(pixels, range(9, 19), range(9, 19))

        # Calculate total density
        total_density = sum(pixels) / (28 * 28 * 255.0)

        # Simple heuristic scoring
        scores = [0.0] * 10

        # Pattern matching heuristics
        if center_density > 0.3 and total_density > 0.2:
            scores[0] = 0.6 + random.random() * 0.2  # Could be 0
            scores[8] = 0.5 + random.random() * 0.15  # Could be 8

        if top_density < 0.15 and bottom_density > 0.3 and left_density < right_density:
            scores[1] = 0.7 + random.random() * 0.2  # Likely 1
            scores[7] = 0.4 + random.random() * 0.1  # Could be 7

        if top_density > 0.3 and bottom_density > 0.3:
            scores[2] = 0.5 + random.random() * 0.2  # Could be 2
            scores[3] = 0.4 + random.random() * 0.15  # Could be 3

        if middle_density > 0.35:
            scores[4] = 0.5 + random.random() * 0.15  # Could be 4
            scores[5] = 0.45 + random.random() * 0.15  # Could be 5
            scores[6] = 0.4 + random.random() * 0.1  # Could be 6

        if top_density > 0.25:
            scores[7] = max(scores[7], 0.4 + random.random() * 0.15)  # Could be 7
            scores[9] = 0.45 + random.random() * 0.15  # Could be 9

        # Add baseline randomness for unassigned scores
        for i in range(10):
            if scores[i] < 0.1:
                scores[i] = random.random() * 0.2

        # Normalize scores
        total = sum(scores)
        if total > 0:
            scores = [s / total for s in scores]

        # Get top 3 predictions
        scored_digits = [(scores[i], i) for i in range(10)]
        scored_digits.sort(reverse=True)

        results = []
        for score, digit in scored_digits[:3]:
            results.append({
                'digit': digit,
                'confidence': score
            })

        return results
