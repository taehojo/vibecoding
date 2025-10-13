# CLAUDE.md - Web Version

This file provides guidance to Claude Code (claude.ai/code) when working with the web version of the handwritten digit recognition application.

## Project Overview

Web-based handwritten digit recognition application using Flask backend with TensorFlow/Keras for machine learning and HTML5 Canvas for the drawing interface. Features real-time MNIST digit classification accessible through any modern web browser.

## Commands

### Install Dependencies
```batch
install_requirements.bat
```
Or manually:
```bash
pip install -r requirements.txt
```

### Run Application
```batch
run_web.bat
```
Or directly:
```bash
python app.py
```
Then open browser to: http://localhost:5000

## Architecture

### Backend Components

**Flask Application** (`app.py`)
- RESTful API endpoint for digit prediction
- CORS enabled for cross-origin requests
- Serves static files and templates
- Handles base64 image decoding and preprocessing

**DigitRecognizer Class** (`app.py`)
- Loads and preprocesses MNIST dataset
- Builds CNN model identical to desktop version
- Trains model on server startup (5 epochs)
- Processes base64 images from frontend
- Returns top 3 predictions as JSON

### Frontend Components

**HTML Template** (`templates/index.html`)
- Responsive layout with Canvas element
- Control buttons for Clear and Predict
- Dynamic results display area

**JavaScript** (`static/js/app.js`)
- DrawingApp class for canvas management
- Mouse and touch event handling
- Canvas to base64 conversion
- Async API calls to backend
- Dynamic prediction visualization

**CSS Styling** (`static/css/style.css`)
- Modern gradient design
- Responsive layout
- Animated prediction bars
- Mobile-friendly interface

### Model Architecture
```
Input: 28x28x1 grayscale images
├── Conv2D (32 filters, 3x3, ReLU)
├── MaxPooling2D (2x2)
├── Conv2D (64 filters, 3x3, ReLU)
├── MaxPooling2D (2x2)
├── Flatten
├── Dropout (0.5)
├── Dense (128, ReLU)
├── Dropout (0.5)
└── Dense (10, Softmax) → Output
```

### Request Flow
1. User draws on HTML5 Canvas (280x280)
2. JavaScript captures canvas as base64 PNG
3. POST request to `/predict` endpoint
4. Flask decodes and preprocesses image
5. Model makes prediction
6. JSON response with top 3 predictions
7. Frontend displays results with confidence bars

## API Endpoints

### GET /
- Serves main application page
- Returns: HTML template

### POST /predict
- Predicts digit from drawn image
- Request body: `{ "image": "data:image/png;base64,..." }`
- Response: 
```json
{
  "success": true,
  "predictions": [
    {"digit": 7, "confidence": 0.95},
    {"digit": 1, "confidence": 0.03},
    {"digit": 9, "confidence": 0.01}
  ]
}
```

## Features

- **Real-time Recognition**: Instant predictions via AJAX
- **Touch Support**: Works on tablets and smartphones
- **Visual Feedback**: Animated confidence bars
- **Responsive Design**: Adapts to different screen sizes
- **Cross-browser**: Compatible with all modern browsers
- **No Installation**: Web-based, no client software needed

## File Structure
```
web_version/
├── app.py                 # Flask application and ML model
├── requirements.txt       # Python dependencies
├── run_web.bat           # Windows startup script
├── install_requirements.bat # Windows install script
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── style.css     # Application styles
    └── js/
        └── app.js        # Frontend JavaScript
```

## Development Notes

- Model trains on server startup (consider caching)
- Base64 encoding adds ~33% overhead to image size
- Canvas size (280x280) provides smooth drawing experience
- Predictions include top 3 results for better UX
- CORS enabled for API testing and development

## Security Considerations

- Input validation for base64 images
- Size limits on uploaded data
- Rate limiting recommended for production
- HTTPS recommended for deployment
- Sanitize all user inputs

## Deployment Options

1. **Local Development**: `python app.py`
2. **Production**: Use WSGI server (Gunicorn, uWSGI)
3. **Cloud Platforms**: Heroku, AWS, Google Cloud
4. **Docker**: Create container with model pre-trained

## Potential Improvements

- WebSocket for real-time predictions while drawing
- Save/load pre-trained models
- User feedback to improve model
- Drawing history and undo functionality
- Export drawings as dataset
- Multi-language support
- Progressive Web App (PWA) features
- Model versioning and A/B testing