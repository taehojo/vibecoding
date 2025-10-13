"""
사전에 MNIST 모델을 학습하고 저장하는 스크립트
"""
import tensorflow as tf
from tensorflow import keras
import numpy as np

# Load and preprocess MNIST dataset
print("Loading MNIST dataset...")
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
x_train = x_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
y_train = keras.utils.to_categorical(y_train, 10)
x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0
y_test = keras.utils.to_categorical(y_test, 10)

# Build model
print("Building model...")
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

# Train model
print("Training model...")
model.fit(x_train, y_train,
          epochs=5, batch_size=128,
          validation_split=0.1, verbose=1)

# Evaluate
test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
print(f"Test accuracy: {test_acc:.4f}")

# Save model
print("Saving model...")
model.save('mnist_model.h5')
print("Model saved as mnist_model.h5")
