'use strict';

const { Readable } = require('stream');

const createSdpText = (rtpParameters) => {
  const { codecs, encodings, cname, kind } = rtpParameters;

  const ssrc = encodings[0].ssrc;
  const codec = codecs[0];
  const payloadType = codec.payloadType;
  const codecName = codec.mimeType.split('/')[1];

  return `v=0
o=- 0 0 IN IP4 127.0.0.1
s=FFmpeg RTP Stream
c=IN IP4 127.0.0.1
t=0 0
m=${kind} 5004 RTP/AVP ${payloadType}
a=rtpmap:${payloadType} ${codecName}/${codec.clockRate}
a=ssrc:${ssrc} cname:${cname}
a=recvonly
`;
};

const convertStringToStream = (text) => {
  const stream = new Readable();
  stream.push(text);
  stream.push(null);
  return stream;
};

module.exports = { convertStringToStream, createSdpText };