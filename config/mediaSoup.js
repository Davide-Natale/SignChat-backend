'use strict';

const mediasoup = require('mediasoup');

const workerSettings = {
  logLevel: 'warn',
  rtcMinPort: 40000,
  rtcMaxPort: 49999,
};

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

let worker;
let router;
let transports = new Map();
let producers = new Map;
let consumers = new Map;

const initMediaSoup = async () => {
  worker = await mediasoup.createWorker(workerSettings);
  worker.on("died", () => { //  TODO: remove once tested
    console.error("Mediasoup worker has died");
    process.exit(1);
  });

  router = await worker.createRouter({ mediaCodecs });
};

const createTransport = async (userId) => {
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: '0.0.0.0', announcedIp: process.env.PUBLIC_IP }],
    enableUdp: true,
    enableTcp: true,
  });

  transports.set(userId, transport);
  
  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
};

const getRouter = () => router;

module.exports = { initMediaSoup, createTransport, getRouter, transports, producers, consumers };