# CLAUDE.md - Desktop Version

This file provides guidance to Claude Code (claude.ai/code) when working with the desktop version of the handwritten digit recognition application.

## Project Overview

Desktop-based handwritten digit recognition application using TensorFlow/Keras for machine learning and Tkinter for the GUI interface. Features real-time MNIST digit classification with an interactive drawing canvas.

## Commands

### Install Dependencies
```batch
install_requirements.bat
```
Or manually:
```bash
pip install tensorflow numpy pillow opencv-python
```

### Run Application
```batch
run_digit_recognition.bat
```
Or directly:
```bash
python digit_recognition.py
```

## Architecture

### Core Components

**DigitRecognizer Class** (`digit_recognition.py`)
- Loads and preprocesses MNIST dataset
- Builds CNN model with 2 Conv2D layers, MaxPooling, Dropout, and Dense output layer
- Trains model on startup (5 epochs)
- Provides `predict_digit()` method for inference
- Model is trained fresh each time the application starts

**DrawingApp Class** (`digit_recognition.py`)
- Creates Tkinter GUI with 280x280 pixel drawing canvas
- Handles mouse events for drawing with configurable brush size
- Processes drawn images for model input (resize to 28x28, invert colors, normalize)
- Displays top 3 predictions with confidence scores
- Includes Clear button to reset canvas

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

### Image Processing Pipeline
1. User draws on 280x280 canvas
2. Canvas content captured as PIL Image
3. Image resized to 28x28 pixels
4. Colors inverted (white background, black digit)
5. Converted to NumPy array
6. Normalized to 0-1 range
7. Reshaped for model input (1, 28, 28, 1)
8. Fed to model for prediction

## Features

- **Real-time Recognition**: Predictions update as you draw
- **Confidence Display**: Shows top 3 predictions with percentages
- **Drawing Tools**: Adjustable brush for natural handwriting
- **Clear Function**: Reset canvas for new drawings
- **Cross-platform**: Works on Windows, macOS, and Linux

## Development Notes

- Single-file application (`digit_recognition.py`)
- Model training occurs at startup (not persisted)
- No external model files required
- Batch files provided for Windows convenience
- Python 3.7+ recommended for TensorFlow compatibility

## Potential Improvements

- Save/load trained models to avoid retraining
- Add more drawing tools (eraser, brush size adjustment)
- Export drawn digits as images
- Add confusion matrix visualization
- Implement model fine-tuning with user corrections