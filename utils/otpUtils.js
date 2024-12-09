'use strict';

const crypto = require('crypto');
const redisClient = require('../config/redisClient');

const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const storeOtp = async (email, otp, expiry) => {
    if(expiry > 0) {
        const otpKey = `otp:${email}`;
        await redisClient.set(otpKey, otp, { EX: expiry });
    }
};

const deleteOtp = async (email) => {
    const otpKey = `otp:${email}`;
    await redisClient.del(otpKey);
}

const isOtpValid = async(email, inputOtp) => {
    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);
    return inputOtp === storedOtp;
};

const getOtpTTL = async (email) => {
    const otpKey = `otp:${email}`;
    return await redisClient.ttl(otpKey);
};

module.exports = { generateOtp, storeOtp, deleteOtp, isOtpValid, getOtpTTL };