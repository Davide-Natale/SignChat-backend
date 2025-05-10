'use strict';

const mediasoup = require('mediasoup');
const FFmpeg = require('../utils/ffmpeg');

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
      listenInfos :
      [
        {
          protocol: 'udp', 
          ip: process.env.SERVER_IP,
          portRange: {
            min: 40000,
            max: 49999
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

const consumeAndRecord = async (router, transport, producer) => {
  const rtpPort = 5004;

  await transport.connect({
    ip: '127.0.0.1',
    port: rtpPort
  });

  const codecs = [];
  const routerCodec = router.rtpCapabilities.codecs.find(
    codec => codec.kind === producer.kind
  );

  codecs.push(routerCodec);

  const rtpCapabilities = {
    codecs,
    rtcpFeedback: []
  };

  console.log('Consumer RTPcapabilities: ', rtpCapabilities)

  const consumer = await transport.consume({
    producerId: producer.id,
    rtpCapabilities,
    paused: true
  });

  const rtpParameters = {
    mid: consumer.mid,
    kind: consumer.kind,
    codecs: consumer.rtpParameters.codecs,
    encodings: consumer.rtpParameters.encodings,
    cname: 'mediasoup',
    fileName: `recording-${Date.now()}`
  };

  const ffmpeg = new FFmpeg(rtpParameters);

  //  Handle producerclose event
  consumer.on('transportclose', () => {
    console.log("[Mediasoup] Transport chiuso. Fermando la registrazione...");

    // Kill FFmpeg
    /*if (ffmpeg) {
      console.log("[FFMPEG] Interrompendo il processo di registrazione...");
      ffmpeg.kill();
    }*/
  });

  setTimeout(async () => {
    await consumer.resume();
    await consumer.requestKeyFrame();
  }, 1000);

  return consumer;
};

module.exports = { initMediaSoup, createTransport, createPlainTransport, consumeAndRecord };