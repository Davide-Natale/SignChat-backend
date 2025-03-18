'use strict';

const { Server } = require('socket.io');
const authenticateSocket = require('../middlewares/socketAuthMiddleware');

let io;
const activeUsers = new Map();

//  TODO: remove logging when test completed
function initWebSocket(server) {
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
        socketIds: [socket.id],
        activeCalls: new Map()
      });
    } else {
      //  Get user data from active users
      const userData = activeUsers.get(userId);

      //  Add new socketId to user
      if(!userData.socketIds.includes(socket.id)) {
        userData.socketIds.push(socket.id);
      }
      
      activeUsers.set(userId, userData);
    }

    console.log(`User connected: ${userId} (${socket.id})`);
    console.log(activeUsers);

    const { onGetRouterRtpCapabilities } = require('../handlers/mediaSoupHandlers');
    const { onCallUser, onEndCall, onAnswerCall, onRejectCall } = require('../handlers/callHandlers')(io, activeUsers, socket);
    
    //  Get Router RtpCapabilities
    socket.on('getRouterRtpCapabilities', onGetRouterRtpCapabilities);

    //  Start Video Call
    socket.on('call-user', onCallUser);

    //  End Video Call
    socket.on('end-call', onEndCall);

    //  Answer Video Call
    socket.on('answer-call', onAnswerCall);

    //  Reject Video Call
    socket.on('reject-call', onRejectCall);

    //  User Disconnection
    socket.on('disconnect', () => {
      if(activeUsers.has(userId)) {
        const userData = activeUsers.get(userId);

        //  Remove socketId from the active ones associated to userId
        userData.socketIds = userData.socketIds.filter(socketId => socketId !== socket.id);

        if(userData.socketIds.length === 0) {
          //  Remove userId from active users if no more socketId are present
          activeUsers.delete(userId);
        } else {
          //  Udpate socketIds list associated to userId instead
          activeUsers.set(userId, userData);
        }
        
        console.log(`Utente disconnected: ${userId}`);
        console.log(activeUsers);
      }
    });
  });
}

module.exports = { initWebSocket };