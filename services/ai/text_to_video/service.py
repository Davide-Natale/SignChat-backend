import socket
from translation.translate import process_audio

def open_ffmpeg_connection(host: str, port: int):
    ffmpeg_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    ffmpeg_socket.connect((host, port))
    print("Opened connection to FFmpeg")

    return ffmpeg_socket

def close_ffmpeg_connection(ffmpeg_socket: socket.socket):
    ffmpeg_socket.close()
    print("Closed connection to FFmpeg")

def handle_connection(client_socket: socket.socket, ffmpeg_socket: socket.socket):
    BUFFER_SIZE = 192000
    buffer = bytearray()

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

            if len(buffer) >= BUFFER_SIZE:
                process_audio(buffer, ffmpeg_socket)
                buffer.clear()

    finally:
        client_socket.close()

HOST = '0.0.0.0'
PORT = 9003
FFMPEG_HOST = 'node'
FFMPEG_PORT = 9004

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