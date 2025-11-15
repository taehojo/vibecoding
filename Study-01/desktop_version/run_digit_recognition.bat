@echo off
title Handwritten Digit Recognition

echo Starting Handwritten Digit Recognition Application...
echo.
echo Please wait while the neural network loads...
echo.

python digit_recognition.py

if errorlevel 1 (
    echo.
    echo Error: Failed to run the program.
    echo Please make sure Python and required libraries are installed.
    echo.
    echo Required libraries:
    echo - tensorflow
    echo - numpy
    echo - pillow
    echo - opencv-python
    echo.
    echo To install, run: pip install tensorflow numpy pillow opencv-python
    echo.
    pause
)