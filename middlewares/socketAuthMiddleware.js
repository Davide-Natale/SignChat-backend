'use strict';

const jwt = require('jsonwebtoken');
const { isTokenBlacklisted } = require('../utils/blacklistUtils');

const authenticateSocket = async (socket, next) => {
    let token = socket.handshake.auth.token;
    if(!token) return next(new Error('Access Token missing.'));
    token = token.split(' ')[1];

    try {
        //  Check if token is blacklisted
        const isBlacklisted = await isTokenBlacklisted(token);
        if(isBlacklisted) return next(new Error('Access Token blacklisted.'));

        //  Verify Access Token
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        //  Attach the decoded user data to the socket
        socket.user = payload;

        next();
    } catch (error) {
        next(new Error('Invalid Access Token.'));
    }
};

module.exports = authenticateSocket;