'use strict';

const jwt = require('jsonwebtoken');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

module.exports = generateTokens;
