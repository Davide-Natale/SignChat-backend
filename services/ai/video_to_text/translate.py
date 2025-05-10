import os
import time
import numpy as np
import tensorflow as tf
import pyttsx3
from video_to_text.utils import load_labels_mapping, preprocess_pose
from pose_format.utils.holistic import load_holistic

# Parameters
CSV_NAME = 'jester.csv'
MODEL_FILE_NAME = 'best_model.keras'

script_dir = os.path.dirname(__file__)
csv_path = os.path.join(script_dir, CSV_NAME)
model_path = os.path.join(script_dir, MODEL_FILE_NAME)

# Loading labels mapping
index_to_label = load_labels_mapping(csv_path)


# Loading model
model = tf.keras.models.load_model(model_path)

def process_gesture(frame_buffer, fps, width, height):
    # Translate framse to pose
    pose = load_holistic(frame_buffer,
                            fps=fps,
                            width=width,
                            height=height,
                            additional_holistic_config={'model_complexity': 1})

    # Preprocess model input
    input = preprocess_pose(pose)

    # Model prediction
    prediction = model.predict(input, verbose=0)
    label = np.argmax(prediction)
    predicted_text = index_to_label[label]

    timestamp = int(time.time())
    audio_filename = f'gesture_audio_{timestamp}.mp3'

    engine = pyttsx3.init()

    engine.save_to_file(predicted_text, audio_filename)
    engine.runAndWait()