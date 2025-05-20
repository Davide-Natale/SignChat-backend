FROM node:22

RUN apt-get update && apt-get install -y \
  python3 python3-pip python3-dev \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
EXPOSE 40000-41000/udp

CMD ["npm", "start"]
