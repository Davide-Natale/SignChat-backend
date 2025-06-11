import os
import io
import torch
import tempfile
import numpy as np
import tensorflow as tf
from TTS.api import TTS
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

# Loading TTS model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tts_model = TTS(model_name="tts_models/en/ljspeech/fast_pitch")
tts_model.to(device)

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

    try:
        silence_start = (np.zeros(48000 * 2 // 10, dtype=np.int16)).tobytes()
        ffmpeg_socket.sendall(silence_start)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as wav_fp:
            tts_model.tts_to_file(text=predicted_text, file_path=wav_fp.name)

            audio = AudioSegment.from_file(wav_fp.name, format="wav")
            pcm_buffer = io.BytesIO()
            audio.export(pcm_buffer, format="s16le", parameters=["-ar", "48000", "-ac", "2"])

            ffmpeg_socket.sendall(pcm_buffer.getvalue())

        silence_end = (np.zeros(48000 * 2 // 5, dtype=np.int16)).tobytes()
        ffmpeg_socket.sendall(silence_end)

    except (BrokenPipeError, ConnectionResetError) as e:
        print(f"[WARN] Cannot write to ffmpeg socket: {type(e).__name__} - {e}")
        return last_predicted_text

    return predicted_text