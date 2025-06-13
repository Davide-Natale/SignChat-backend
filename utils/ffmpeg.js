'use strict';

const child_process = require('child_process');
const { createSdpText, convertStringToStream } = require('./sdp');

const setupProcessLogging = (process, tag) => {
  if (process.stderr) {
    process.stderr.setEncoding('utf-8');
    process.stderr.on('data', data => console.log(`[${tag}][stderr]: `, data));
  }

  if (process.stdout) {
    process.stdout.setEncoding('utf-8');
    process.stdout.on('data', data => console.log(`[${tag}][stdout]: `, data));
  }

  process.on('error', error => console.error(`[${tag}][error]: `, error));
  process.once('close', () => console.log(`[${tag}] process terminated.`));
};

const getFFmpegArgs = (parameters, action) => {
  if (parameters.kind === 'video' && action === 'recv') {
    return [
      '-loglevel', 'warning',
      '-protocol_whitelist', 'pipe,udp,rtp,file,crypto,tcp',
      '-fflags', '+genpts',
      '-f', 'sdp',
      '-i', 'pipe:0',
      '-f', 'image2pipe',
      '-vf', 'fps=30',
      '-vcodec', 'mjpeg',
      `tcp://video-translator:${parameters.outputPort}`
    ];
  } else if (parameters.kind === 'audio' && action === 'send') {
    const codec = parameters.codecs[0];
    const ssrc = parameters.encodings[0].ssrc;
    const payloadType = codec.payloadType;

    return [
      '-loglevel', 'warning',
      '-nostdin',
      '-re',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      '-i', `tcp://0.0.0.0:${parameters.inputPort}?listen`,
      '-acodec', 'libopus',
      '-ab', '64k',
      '-map', '0:a:0',
      '-f', 'tee',
      `[select=a:f=rtp:ssrc=${ssrc}:payload_type=${payloadType}]rtp://127.0.0.1:${parameters.outputPort}`
    ];
  } else if (parameters.kind === 'audio' && action === 'recv') {
    return [
      '-loglevel', 'warning',
      '-protocol_whitelist', 'pipe,udp,rtp,file,crypto,tcp',
      '-fflags', '+genpts',
      '-f', 'sdp',
      '-i', 'pipe:0',
      '-acodec', 'pcm_s16le',
      '-f', 's16le',
      '-ac', '2',
      '-ar', '48000',
      `tcp://audio-translator:${parameters.outputPort}`
    ];
  } else if (parameters.kind === 'video' && action === 'send') {
    const codec = parameters.codecs[0];
    const ssrc = parameters.encodings[0].ssrc;
    const payloadType = codec.payloadType;

    return [
      '-loglevel', 'warning',
      '-nostdin',
      '-re',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-framerate', '30',
      '-i', `tcp://0.0.0.0:${parameters.inputPort}?listen`,
      '-c:v', 'libvpx',
      '-b:v', '1000k',
      '-deadline', 'realtime',
      '-cpu-used', '4',
      '-map', '0:v:0',
      '-f', 'tee',
      `[select=v:f=rtp:ssrc=${ssrc}:payload_type=${payloadType}]rtp://127.0.0.1:${parameters.outputPort}`
    ];
  }

  throw new Error(`Unsupported combination of kind (${parameters.kind}) and action (${action}).`);
}

const spawnFFmpeg = (parameters, action) => {
  const tag = `ffmpeg-${parameters.kind}-${action}`;
  const args = getFFmpegArgs(parameters, action)
  const process = child_process.spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] });

  setupProcessLogging(process, tag);
  
  if (action === 'recv') {
    const sdpString = createSdpText(parameters, action);
    const sdpStream = convertStringToStream(sdpString);

    sdpStream.on('error', error => console.error(`[sdpStream-${parameters.kind}-${action}][error]: `, error));
    sdpStream.resume();
    sdpStream.pipe(process.stdin);
  }

  return process;
}

module.exports = { spawnFFmpeg };