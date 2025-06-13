'use strict';

const { Readable } = require('stream');

const createSdpText = (parameters, action) => {
  const { codecs, encodings, cname, kind, inputPort } = parameters;
  const ssrc = encodings[0].ssrc;
  const codec = codecs[0];
  const payloadType = codec.payloadType;
  const codecName = codec.mimeType.split('/')[1];
  const clockRate = codec.clockRate;
  const channels = codec.channels || 2;

  let sdp = `v=0
o=- 0 0 IN IP4 127.0.0.1
s=FFmpeg RTP Stream
c=IN IP4 127.0.0.1
t=0 0
`;

  if (kind === 'video' && action === 'recv') {
    sdp += `m=video ${inputPort} RTP/AVP ${payloadType}
a=rtpmap:${payloadType} ${codecName}/${clockRate}
a=ssrc:${ssrc} cname:${cname}
a=recvonly
`;
  } else if (kind === 'audio' && action === 'recv') {
    sdp += `m=audio ${inputPort} RTP/AVP ${payloadType}
a=rtpmap:${payloadType} ${codecName}/${clockRate}/${channels}
a=ssrc:${ssrc} cname:${cname}
a=recvonly
`;
  }

  return sdp;
};

const convertStringToStream = (text) => {
  const stream = new Readable();
  stream.push(text);
  stream.push(null);
  return stream;
};

module.exports = { convertStringToStream, createSdpText };