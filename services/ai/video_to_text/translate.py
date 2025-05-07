import cv2
import numpy as np
import tensorflow as tf
from gtts import gTTS
from utils import load_labels_mapping, preprocess_pose
from pose_format.utils.holistic import load_holistic

# Parameters
TARGET_FRAMES = 37
VIDEO_SOURCE = '13611.mp4'
CSV_PATH = 'jester.csv'

# Loading labels mapping
index_to_label = load_labels_mapping(CSV_PATH)

# Loading model
model = tf.keras.models.load_model("best_model.keras")

# Video processing
cap = cv2.VideoCapture(VIDEO_SOURCE)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
frame_buffer = []

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_buffer.append(rgb)

    if len(frame_buffer) == TARGET_FRAMES:
        pose = load_holistic(frame_buffer,
                             fps=fps,
                             width=width,
                             height=height,
                             additional_holistic_config={'model_complexity': 1})
        
        frame_buffer = []
        input = preprocess_pose(pose)
        prediction = model.predict(input, verbose=0)
        label = np.argmax(prediction)
        predicted_text = index_to_label[label]

        print('Prediction: ', label, predicted_text)

        tts = gTTS(text=predicted_text, lang='en')
        tts.save('gesture_audio.mp3')

cap.release()