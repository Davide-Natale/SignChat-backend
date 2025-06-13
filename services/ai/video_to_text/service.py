import cv2
import socket
import numpy as np
from collections import deque
from translation.translate import process_gesture

def open_ffmpeg_connection(host: str, port: int):
    ffmpeg_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    ffmpeg_socket.connect((host, port))
    print("Opened connection to FFmpeg")

    return ffmpeg_socket

def close_ffmpeg_connection(ffmpeg_socket: socket.socket):
    ffmpeg_socket.close()
    print("Closed connection to FFmpeg")

def handle_connection(client_socket: socket.socket, ffmpeg_socket: socket.socket):
    N = 5
    fps = 30
    buffer = bytearray()
    width, height = None, None
    last_predicted_test = None
    frame_batch_counter = 0
    buffer_initialized = False
    frame_buffer = deque(maxlen=TARGET_FRAMES)
    
    try:
        while True:
            try:
                data = client_socket.recv(4096)
            except ConnectionResetError:
                print("Connection reset by peer (FFmpeg process terminated).")
                break
            except Exception as e:
                print(f"Unexpected error during recv: {e}")
                break
            
            if not data:
                break

            buffer.extend(data)

            while True:
                start = buffer.find(b'\xff\xd8')  # JPEG start
                end = buffer.find(b'\xff\xd9')  # JPEG end

                if start != -1 and end != -1 and end > start:
                    jpg = buffer[start:end+2]
                    del buffer[:end+2]

                    img_array = np.frombuffer(jpg, dtype=np.uint8)
                    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

                    if frame is None:
                        continue

                    if width is None or height is None:
                        height, width, _ = frame.shape

                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    if not buffer_initialized:
                        frame_buffer.extend([rgb] * TARGET_FRAMES)
                        buffer_initialized = True
                    else:
                        frame_buffer.append(rgb)
                        
                    frame_batch_counter += 1

                    if frame_batch_counter == N:
                        last_predicted_test = process_gesture(list(frame_buffer), fps, width, height, ffmpeg_socket, last_predicted_test)
                        frame_batch_counter = 0
                else:
                    break

    finally:
        client_socket.close()

TARGET_FRAMES = 37
HOST = '0.0.0.0'
PORT = 9001
FFMPEG_HOST = 'node'
FFMPEG_PORT = 9002

server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind((HOST, PORT))
server_socket.listen(1)
print(f"Listening on {HOST}:{PORT}...")

while True:
    client_socket, addr = server_socket.accept()
    print(f"Connection from {addr}")

    ffmpeg_socket = open_ffmpeg_connection(FFMPEG_HOST, FFMPEG_PORT)
    handle_connection(client_socket, ffmpeg_socket)
    close_ffmpeg_connection(ffmpeg_socket)

    print(f"Connection with {addr} closed")