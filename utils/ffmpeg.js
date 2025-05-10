'use strict';

const child_process = require('child_process');
const { EventEmitter } = require('events');
const { createSdpText, convertStringToStream } = require('./sdp');

module.exports = class FFmpeg {
  constructor(rtpParameters) {
    this._rtpParameters = rtpParameters;
    this._process = undefined;
    this._observer = new EventEmitter();
    this._createProcess();
  }

  _createProcess() {
    const sdpString = createSdpText(this._rtpParameters);
    const sdpStream = convertStringToStream(sdpString);

    this._process = child_process.spawn('ffmpeg', this._commandArgs, { stdio: ['pipe', 'pipe', 'pipe'] });

    if (this._process.stderr) {
      this._process.stderr.setEncoding('utf-8');
      this._process.stderr.on('data', data => console.log('[ffmpeg][stderr]:', data));
    }

    if (this._process.stdout) {
      this._process.stdout.setEncoding('utf-8');
      this._process.stdout.on('data', data => console.log('[ffmpeg][stdout]:', data));
    }

    this._process.on('error', error => console.error('[ffmpeg][error]:', error));
    this._process.once('close', () => {
      console.log('[ffmpeg] processo terminato');
      this._observer.emit('process-close');
    });

    sdpStream.on('error', error => console.error('[sdpStream][error]:', error));
    sdpStream.resume();
    sdpStream.pipe(this._process.stdin);
  }

  kill() {
    if (this._process) {
      console.log('[ffmpeg] kill() [pid:%d]', this._process.pid);

      this._process.stdin.end();
      this._process.kill('SIGINT');
    }
  }

  get _commandArgs() {
    return [
      '-loglevel', 'warning',
      '-protocol_whitelist', 'pipe,udp,rtp,file,crypto,tcp',
      '-fflags', '+genpts',
      '-f', 'sdp',
      '-i', 'pipe:0',
      '-f', 'image2pipe',
      '-vf', 'fps=10',
      '-vcodec', 'mjpeg',
      'tcp://127.0.0.1:9001'
    ];
  }
};
