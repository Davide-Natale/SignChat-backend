import os
import io
import numpy as np
import tensorflow as tf
from gtts import gTTS
from pydub import AudioSegment
from translation.utils import load_labels_mapping, preprocess_pose
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

def process_gesture(frame_buffer, fps, width, height, ffmpeg_socket, last_predicted_text):
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

    print(f'Last Prediction: {last_predicted_text}')
    print(f'Prediction: {predicted_text}')

    if predicted_text == last_predicted_text:
        return last_predicted_text
    
    last_predicted_text = predicted_text

    silence_start = (np.zeros(48000 * 2 // 10, dtype=np.int16)).tobytes()
    ffmpeg_socket.sendall(silence_start)

    tts = gTTS(predicted_text, lang='en')
    mp3_fp = io.BytesIO()
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    audio = AudioSegment.from_file(mp3_fp, format="mp3")
    audio = audio.set_frame_rate(48000).set_channels(2).set_sample_width(2)

    pcm_data = audio.raw_data
    ffmpeg_socket.sendall(pcm_data)

    silence_end = (np.zeros(48000 * 2 // 5, dtype=np.int16)).tobytes()
    ffmpeg_socket.sendall(silence_end)

    return predicted_text