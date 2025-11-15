# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Python-based handwritten digit recognition application using TensorFlow/Keras for machine learning and Tkinter for the GUI interface. The project demonstrates MNIST digit classification with an interactive drawing canvas.

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

**DrawingApp Class** (`digit_recognition.py`)
- Creates Tkinter GUI with 280x280 pixel drawing canvas
- Handles mouse events for drawing
- Processes drawn images for model input (resize to 28x28, invert colors, normalize)
- Displays predictions with confidence scores

### Model Architecture Flow
1. Input: 28x28 grayscale images
2. Conv2D (32 filters, 3x3) → ReLU → MaxPooling2D
3. Conv2D (64 filters, 3x3) → ReLU → MaxPooling2D
4. Flatten → Dropout(0.5) → Dense(128) → ReLU → Dropout(0.5)
5. Output: Dense(10) with softmax for digit classification

### Image Processing Pipeline
User drawing → PIL Image capture → Resize to 28x28 → Color inversion → NumPy array conversion → Normalization (0-1 range) → Model prediction

## Development Notes

- Single-file application structure (`digit_recognition.py` contains all logic)
- Model training occurs at application startup (not persistent between runs)
- No test suite or linting configuration present
- Windows batch files provided for convenience but application is cross-platform Python