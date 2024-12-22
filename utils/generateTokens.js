'use strict';

const jwt = require('jsonwebtoken');

const generateTokens = (user, 
  options = { 
    generateBoth: true,
    accessExpiry: '30m',
    refreshExpiry: '30d'
  }
) => {
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: options.accessExpiry }
  );

  if(options.generateBoth) {
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: options.refreshExpiry }
    );

    return { accessToken, refreshToken };
  }

  return { accessToken };
};

module.exports = generateTokens;
