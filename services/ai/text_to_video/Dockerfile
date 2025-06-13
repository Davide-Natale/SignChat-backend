FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa -y \
    && apt-get update && apt-get install -y \
    python3.11 \
    python3.11-dev \
    python3.11-distutils \
    curl \
    git \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11 \
    && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/python3.11 /usr/bin/python && ln -sf /usr/bin/python3.11 /usr/bin/python3

WORKDIR /app

COPY requirements.txt ./

RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

RUN python -c "import whisper; whisper.load_model('base')"

COPY . .

RUN git clone https://github.com/ZurichNLP/spoken-to-signed-translation ./translation/spoken_to_signed_translation \
    && pip install -e ./translation/spoken_to_signed_translation

CMD ["python", "-u", "service.py"]