'use strict';

const { Server } = require('socket.io');
const authenticateSocket = require('../middlewares/socketAuthMiddleware');

let io;
const activeUsers = new Map();
const transports = new Map();
const producers = new Map();
const pendingProducers = new Map();
const consumers = new Map();

function initWebSocket(server, router) {
  //  Create WebSocket instance
  io = new Server(server);

  //  Set up middlewares
  io.use(authenticateSocket)

  //  Set up event handlers
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    
    if(!activeUsers.has(userId)) {
      //  Add user to active users if not exists
      activeUsers.set(userId, {
        status: 'available',
        isReadyToConsume: false,
        socketIds: [socket.id],
        transportIds: [],
        producerIds: [],
        consumerIds: [],
        activeCalls: new Map()
      });
    } else {
      //  Get user data from active users
      const userData = activeUsers.get(userId);

      //  Add new socketId to user
      if(!userData.socketIds.includes(socket.id)) {
        userData.socketIds.push(socket.id);
      }
    }

    const { 
      onGetRouterRtpCapabilities, 
      onConnectTransport, 
      onCreateProducer, 
      onPauseProducer, 
      onResumeProducer, 
      onCreateConsumer, 
      onResumeConsumer,
      onReadyToConsume,
    } = require('../handlers/mediaSoupHandlers')(io, activeUsers, socket, router, transports, producers, pendingProducers, consumers);

    const { 
      onCallUser, 
      onEndCall, 
      onAnswerCall, 
      onRejectCall 
    } = require('../handlers/callHandlers')(io, activeUsers, socket, router, transports, producers, consumers);
    
    //  Get Router RtpCapabilities
    socket.on('getRouterRtpCapabilities', onGetRouterRtpCapabilities);

    //  Connect Transport
    socket.on('connect-transport', onConnectTransport);

    //  Create Producer
    socket.on('create-producer', onCreateProducer);

    //  Pause Producer
    socket.on('pause-producer', onPauseProducer);

    //  Resume Producer
    socket.on('resume-producer', onResumeProducer);

    //  Create Consumer
    socket.on('create-consumer', onCreateConsumer);

    //  Resume Consumer
    socket.on('resume-consumer', onResumeConsumer);

    //  Ready to consume
    socket.on('readyToConsume', onReadyToConsume);

    //  Start Video Call
    socket.on('call-user', onCallUser);

    //  End Video Call
    socket.on('end-call', onEndCall);

    //  Answer Video Call
    socket.on('answer-call', onAnswerCall);

    //  Reject Video Call
    socket.on('reject-call', onRejectCall);

    //  Update Preference
    socket.on('update-preference', ({ type, value }) => {
      if(!activeUsers.has(userId)) return;
      const userData = activeUsers.get(userId);

      //  Update specific preference type
      if(type === 'accessibility') {
        userData.useAccessibility = value;
      }
    });

    //  User Disconnection
    socket.on('disconnect', () => {
      if(activeUsers.has(userId)) {
        const userData = activeUsers.get(userId);

        //  Remove socketId from the active ones associated to userId
        userData.socketIds = userData.socketIds.filter(socketId => socketId !== socket.id);

        if(userData.socketIds.length === 0) {
          //  Remove userId from active users if no more socketId are present
          activeUsers.delete(userId);
        }
      }
    });
  });
}

module.exports = { initWebSocket };