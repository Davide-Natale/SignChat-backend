'use strict';

const mediasoup = require('mediasoup');

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

const initMediaSoup = async () => {
  const worker = await mediasoup.createWorker({ logLevel: 'debug' });
  worker.on("died", () => {
    console.error("Mediasoup worker has died");
    process.exit(1);
  });

  const router = await worker.createRouter({ mediaCodecs });

  return { worker, router };
};

const createTransport = async (router) => {
  try {
    const transport = await router.createWebRtcTransport({
      listenInfos:
        [
          {
            protocol: 'udp',
            ip: '0.0.0.0',
            announcedAddress: process.env.SERVER_IP,
            portRange: {
              min: 40000,
              max: 40099
            }
          }
        ]
    });
    
    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      }
    };
  } catch (error) {
    throw error;
  }
};

const createPlainTransport = async (router, type) => {
  try {
    const comedia = type === 'recv';

    const transport = await router.createPlainTransport({
      listenInfo: { protocol: 'udp', ip: '127.0.0.1' },
      rtcpMux: true,
      comedia
    });

    return transport;
  } catch (error) {
    throw error
  }
};

module.exports = { initMediaSoup, createTransport, createPlainTransport };