import socket
import cv2
import numpy as np
from video_to_text.translate import process_gesture

TARGET_FRAMES = 37
HOST = '127.0.0.1'
PORT = 9001

server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind((HOST, PORT))
server_socket.listen(1)
print(f"Listening on {HOST}:{PORT}...")

while True:
    client_socket, addr = server_socket.accept()
    print(f"Connection from {addr}")
    buffer = b''
    frame_buffer = []
    fps = 10
    width, height = None, None

    try:
        while True:
            data = client_socket.recv(4096)
            if not data:
                break

            buffer += data

            while True:
                start = buffer.find(b'\xff\xd8')  # JPEG start
                end = buffer.find(b'\xff\xd9')  # JPEG end

                if start != -1 and end != -1 and end > start:
                    jpg = buffer[start:end+2]
                    buffer = buffer[end+2:]

                    img_array = np.frombuffer(jpg, dtype=np.uint8)
                    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

                    if frame is None:
                        continue

                    if width is None or height is None:
                        height, width, _ = frame.shape

                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frame_buffer.append(rgb)

                    if len(frame_buffer) == TARGET_FRAMES:
                        process_gesture(frame_buffer, fps, width, height)
                        frame_buffer = []
                else:
                    break

    finally:
        client_socket.close()
