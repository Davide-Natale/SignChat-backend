'use strict';
/*
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
let producers = {};
let consumers = {};
let rooms = {};

async function createWorker() {
  worker = await mediasoup.createWorker(workerSettings);
  router = await worker.createRouter({ mediaCodecs });
  console.log('MediaSoup Worker e Router creati');
}

async function createTransport(userId) {
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
}

function getRouter() {
  return router;
}

module.exports = { createWorker, createTransport, getRouter, transports, producers, consumers, rooms };*/