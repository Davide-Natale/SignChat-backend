'use strict';

const { Server } = require('socket.io');
const authenticateSocket = require('../middlewares/socketAuthMiddleware');
const Token = require('../models/token');
const sendPushNotification = require('../utils/pushNotifications');
//const mediasoup = require('./mediasoup');

let io;
const users = new Map();

function initWebSocket(server) {
  //  Create WebSocket instance
  io = new Server(server);

  //  Set up middlewares
  io.use(authenticateSocket)

  //  Set up event handlers
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId} (${socket.id})`);

    users.set(userId, { socketId: socket.id, status: 'available' });

    // Start Video Call
    socket.on('call-user', async ({ /*from,*/ to }) => {  //  TODO: test if from is really needed
      const targetUser = users.get(to);

      const expoTokens = (await Token.findAll({ 
        where: { ownerId: to },
        attributes: ['expoToken'],
        raw: true
      })).map(t => t.expoToken);

      if(expoTokens.length > 0) {
        try {
          await sendPushNotification(expoTokens, `${userId}`, 'Incoming call', { "type": "incoming-call" });
        } catch (error) {
          //  TODO: add some control
        }
      } else {
        //  TODO: send something to callerUser
      }

      /*if (!targetUser) {
        //  TODO: handle this case using push notification
        socket.emit('user-not-available');
        return;
      }

      if (targetUser.status === 'busy') {
        //  TODO: probably is better to use again push notification to let 
        // user choose if to close current call and answer new one
        socket.emit('user-busy');
        return;
      }*/

      users.set(userId, { socketId: socket.id, status: 'ringing' });
      //users.set(to, { ...targetUser, status: 'ringing' });

      //io.to(targetUser.socketId).emit('incoming-call', { userId });
    });

    // Accept Video Call
    socket.on('accept-call', async ({ from }) => {
      const callerUser = users.get(from);

      if(!callerUser) return;

      users.set(userId, { socketId: socket.id, status: 'busy' });
      users.set(from, { ...callerUser, status: 'busy' });

      io.to(callerUser.socketId).emit('call-accepted');

      //  TODO: uncomment when implement MediaSoup
      //const transportCaller = await mediasoup.createTransport(callerSocketId);
      //const transportReceiver = await mediasoup.createTransport(socket.id);

      //io.to(callerUser.socketId).emit('transport-created', transportCaller);
      //io.to(socket.id).emit('transport-created', transportReceiver);
    });

    // Reject Video Call
    socket.on('reject-call', ({ from }) => {
      const callerUser = users.get(from);

      if(!callerUser) return;

      users.set(userId, { socketId: socket.id, status: 'available' });
      users.set(from, { ...callerUser, status: 'available' });

      io.to(callerUser.socketId).emit('call-rejected');
    });

    // User Disconnection
    socket.on('disconnect', () => {
      users.delete(userId);
      console.log(`Utente disconnected: ${userId}`);
    });
  });
}

module.exports = { initWebSocket };