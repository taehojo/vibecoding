import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import tkinter as tk
from tkinter import Canvas, Button, Label
from PIL import Image, ImageDraw
import cv2

class DigitRecognizer:
    def __init__(self):
        # Load and prepare MNIST dataset
        (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
        
        # Normalize pixel values
        self.x_train = x_train.astype("float32") / 255.0
        self.x_test = x_test.astype("float32") / 255.0
        
        # Reshape data
        self.x_train = np.expand_dims(self.x_train, -1)
        self.x_test = np.expand_dims(self.x_test, -1)
        
        # Convert labels to categorical
        self.y_train = keras.utils.to_categorical(y_train, 10)
        self.y_test = keras.utils.to_categorical(y_test, 10)
        
        # Build and train model
        self.model = self.build_model()
        self.train_model()
    
    def build_model(self):
        # Create CNN model
        model = keras.Sequential([
            layers.Conv2D(32, kernel_size=(3, 3), activation="relu", input_shape=(28, 28, 1)),
            layers.MaxPooling2D(pool_size=(2, 2)),
            layers.Conv2D(64, kernel_size=(3, 3), activation="relu"),
            layers.MaxPooling2D(pool_size=(2, 2)),
            layers.Flatten(),
            layers.Dropout(0.5),
            layers.Dense(10, activation="softmax")
        ])
        
        model.compile(
            optimizer="adam",
            loss="categorical_crossentropy",
            metrics=["accuracy"]
        )
        
        return model
    
    def train_model(self):
        print("Training neural network...")
        self.model.fit(
            self.x_train, self.y_train,
            batch_size=128,
            epochs=5,
            validation_split=0.1,
            verbose=1
        )
        
        # Evaluate model
        score = self.model.evaluate(self.x_test, self.y_test, verbose=0)
        print(f"Test accuracy: {score[1]:.4f}")
    
    def predict_digit(self, image):
        # Preprocess image
        processed = self.preprocess_image(image)
        
        # Make prediction
        prediction = self.model.predict(processed, verbose=0)
        digit = np.argmax(prediction[0])
        confidence = np.max(prediction[0])
        
        return digit, confidence
    
    def preprocess_image(self, image):
        # Convert PIL image to numpy array
        img_array = np.array(image)
        
        # Convert to grayscale if needed
        if len(img_array.shape) == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Resize to 28x28
        img_resized = cv2.resize(img_array, (28, 28))
        
        # Invert colors (MNIST has white digits on black background)
        img_inverted = 255 - img_resized
        
        # Normalize
        img_normalized = img_inverted.astype("float32") / 255.0
        
        # Reshape for model input
        img_reshaped = img_normalized.reshape(1, 28, 28, 1)
        
        return img_reshaped


class DrawingApp:
    def __init__(self):
        self.recognizer = DigitRecognizer()
        
        # Create main window
        self.root = tk.Tk()
        self.root.title("Handwritten Digit Recognition")
        self.root.geometry("400x500")
        
        # Create canvas for drawing
        self.canvas = Canvas(self.root, width=280, height=280, bg="white", cursor="cross")
        self.canvas.pack(pady=20)
        
        # Create image for drawing
        self.image = Image.new("RGB", (280, 280), "white")
        self.draw = ImageDraw.Draw(self.image)
        
        # Bind mouse events
        self.canvas.bind("<B1-Motion>", self.paint)
        self.canvas.bind("<ButtonRelease-1>", self.reset)
        
        # Create buttons
        button_frame = tk.Frame(self.root)
        button_frame.pack(pady=10)
        
        self.recognize_btn = Button(button_frame, text="Recognize", command=self.recognize_digit)
        self.recognize_btn.pack(side=tk.LEFT, padx=5)
        
        self.clear_btn = Button(button_frame, text="Clear", command=self.clear_canvas)
        self.clear_btn.pack(side=tk.LEFT, padx=5)
        
        # Create result label
        self.result_label = Label(self.root, text="Draw a digit and click Recognize", 
                                  font=("Arial", 14))
        self.result_label.pack(pady=10)
        
        # Create confidence label
        self.confidence_label = Label(self.root, text="", font=("Arial", 10))
        self.confidence_label.pack()
        
        # Drawing variables
        self.old_x = None
        self.old_y = None
        self.line_width = 15
    
    def paint(self, event):
        # Draw on canvas
        if self.old_x and self.old_y:
            self.canvas.create_line(self.old_x, self.old_y, event.x, event.y,
                                   width=self.line_width, fill="black",
                                   capstyle=tk.ROUND, smooth=tk.TRUE)
            self.draw.line([self.old_x, self.old_y, event.x, event.y],
                          fill="black", width=self.line_width)
        
        self.old_x = event.x
        self.old_y = event.y
    
    def reset(self, event):
        self.old_x = None
        self.old_y = None
    
    def clear_canvas(self):
        # Clear canvas
        self.canvas.delete("all")
        
        # Create new blank image
        self.image = Image.new("RGB", (280, 280), "white")
        self.draw = ImageDraw.Draw(self.image)
        
        # Reset labels
        self.result_label.config(text="Draw a digit and click Recognize")
        self.confidence_label.config(text="")
    
    def recognize_digit(self):
        # Get prediction
        digit, confidence = self.recognizer.predict_digit(self.image)
        
        # Update labels
        self.result_label.config(text=f"Predicted Digit: {digit}")
        self.confidence_label.config(text=f"Confidence: {confidence:.2%}")
    
    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    print("Starting Handwritten Digit Recognition App...")
    print("This will train a neural network on MNIST dataset.")
    print("Please wait while the model is being trained...")
    
    app = DrawingApp()
    app.run()