'use strict';

const { spawnFFmpeg } = require("./ffmpeg");

const consumeAndProduce = async (router, sendPlainTransport, recvPlainTransport, producer) => {
  const sendRtpPort = producer.kind === 'video' ? 5004 : 5005;
  const recvRtpPort = recvPlainTransport.tuple.localPort;

  await sendPlainTransport.connect({
    ip: '127.0.0.1',
    port: sendRtpPort
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

  const accessibilityConsumer = await sendPlainTransport.consume({
    producerId: producer.id,
    rtpCapabilities,
    paused: true
  });

  const recvFFmpegParameters = {
    kind: accessibilityConsumer.kind,
    codecs: accessibilityConsumer.rtpParameters.codecs,
    encodings: accessibilityConsumer.rtpParameters.encodings,
    cname: 'mediasoup',
    inputPort: sendRtpPort,
    outputPort: producer.kind === 'video' ? 9001 : 9003
  };

  const sendRtpParameters = {
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

  const sendFFmpegParameters = {
    kind: 'audio',
    codecs: sendRtpParameters.codecs,
    encodings: sendRtpParameters.encodings,
    cname: 'mediasoup',
    inputPort: 9002,
    outputPort: recvRtpPort
  }

  const recvFFmpeg = spawnFFmpeg(recvFFmpegParameters, 'recv');
  const sendFFmpeg = spawnFFmpeg(sendFFmpegParameters, 'send');

  const accessibilityProducer = await recvPlainTransport.produce({
    kind: 'audio',
    rtpParameters: sendRtpParameters
  });

  sendPlainTransport.observer.on("close", () => {
    recvFFmpeg.kill('SIGINT');
    sendFFmpeg.kill('SIGINT');
  });

  setTimeout(async () => {
    await accessibilityConsumer.resume();
    await accessibilityConsumer.requestKeyFrame();
  }, 1000);

  return { accessibilityConsumer, accessibilityProducer };
};

module.exports = { consumeAndProduce };
