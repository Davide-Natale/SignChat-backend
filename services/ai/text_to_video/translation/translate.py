import cv2
import torch
import socket
import whisper
from translation.utils import text_to_gloss_to_pose_to_video, convert_audio

# Loading STT model
device = "cuda" if torch.cuda.is_available() else "cpu"
model = whisper.load_model("base", device=device)

def process_audio(audio_buffer: bytearray, ffmpeg_socket: socket.socket):
    try:
        audio_16k = convert_audio(audio_buffer)
        result = model.transcribe(audio_16k, language='it')
        trascribed_text = result['text'].strip()
        print("Transcribed text: ", trascribed_text)

        if not trascribed_text:
            return

        frames = text_to_gloss_to_pose_to_video(trascribed_text)
    
        for frame in frames:
            ret, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if not ret:
                continue
            
            ffmpeg_socket.sendall(jpeg.tobytes())

    except (BrokenPipeError, ConnectionResetError) as e:
        print(f"[WARN] Cannot write to ffmpeg socket: {type(e).__name__} - {e}")
    except Exception as e:
            print(f"Unexpected error during processing: {e}")