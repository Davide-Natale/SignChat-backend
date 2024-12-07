'use strict';

const redisClient = require('../config/redisClient');

const blacklistToken = async (token, expiry) => {
    await redisClient.set(token, 'blacklisted', { EX: expiry });
} 

const isTokenBlacklisted = async (token) => {
    const result = await redisClient.get(token);
    return result === 'blacklisted';
}

module.exports = { blacklistToken, isTokenBlacklisted };
