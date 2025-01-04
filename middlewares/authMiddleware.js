'use strict';

const jwt = require('jsonwebtoken');
const { isTokenBlacklisted } = require('../utils/blacklistUtils');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Access Token missing.' });

  //  Extract token from "Bearer token" format
  const token = authHeader.split(' ')[1];
  
  try {
    //  Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if(isBlacklisted) 
      return res.status(401).json({ message: 'Access Token blacklisted.' });

    //  Verify Access Token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    //  Attach the decoded user data to the request
    req.user = payload;

    next();
  } catch {
    res.status(401).json({ message: 'Invalid Access Token.' });
  }
};

module.exports = authenticate;
