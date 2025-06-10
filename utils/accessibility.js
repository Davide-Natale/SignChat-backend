'use strict';

const { spawnFFmpeg } = require("./ffmpeg");

const consumeAndProduce = async (router, videoPlainTransport, audioPlainTransport, producer) => {
  const videoRtpPort = 5004;
  const audioRtpPort = audioPlainTransport.tuple.localPort;

  await videoPlainTransport.connect({
    ip: '127.0.0.1',
    port: videoRtpPort
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

  const accessibilityConsumer = await videoPlainTransport.consume({
    producerId: producer.id,
    rtpCapabilities,
    paused: true
  });

  const videoFFmpegParameters = {
    kind: accessibilityConsumer.kind,
    codecs: accessibilityConsumer.rtpParameters.codecs,
    encodings: accessibilityConsumer.rtpParameters.encodings,
    cname: 'mediasoup',
    inputPort: videoRtpPort,
    outputPort: 9001
  };

  const audioRtpParameters = {
    codecs:
      [
        {
          mimeType: 'audio/opus',
          clockRate: 48000,
          payloadType: 101,
          channels: 2,
          rtcpFeedback: [],
          parameters: { 'sprop-stereo': 1 }
        }
      ],
    encodings: [{ ssrc: 11111111 }]
  };

  const audioFFmpegParameters = {
    kind: 'audio',
    codecs: audioRtpParameters.codecs,
    encodings: audioRtpParameters.encodings,
    cname: 'mediasoup',
    inputPort: 9002,
    outputPort: audioRtpPort
  }

  const videoFFmpeg = spawnFFmpeg(videoFFmpegParameters, 'recv');
  const audioFFmpeg = spawnFFmpeg(audioFFmpegParameters, 'send');

  const accessibilityProducer = await audioPlainTransport.produce({
    kind: 'audio',
    rtpParameters: audioRtpParameters
  });

  videoPlainTransport.observer.on("close", () => {
    videoFFmpeg.kill('SIGINT');
    audioFFmpeg.kill('SIGINT');
  });

  setTimeout(async () => {
    await accessibilityConsumer.resume();
    await accessibilityConsumer.requestKeyFrame();
  }, 1000);

  return { accessibilityConsumer, accessibilityProducer };
};

module.exports = { consumeAndProduce };
