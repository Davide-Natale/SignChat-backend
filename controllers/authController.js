'use strict';

const bcrypt = require('bcrypt');
const User = require('../models/user');
const { sendEmail, getRegistrationConfirmMessage, getOtpMessage, getChangePasswordMessage } = require('../utils/emailUtils');
const generateTokens = require('../utils/generateTokens');
const { blacklistToken, isTokenBlacklisted } = require('../utils/blacklistUtils');
const { generateOtp, storeOtp, deleteOtp, isOtpValid, getOtpTTL } = require('../utils/otpUtils');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');

exports.register = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if email is already registered
    const user = await User.findOne({ where: { email } });
    if(user) return res.status(409).json({ message: 'User already registered.' });

    //  Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //  Add new user to database
    const newUser = await User.create({ email, password: hashedPassword });

    //  Generate JWT tokens for the user
    const tokens = generateTokens(newUser);

    //  Send confirmation email for registration
    sendEmail({
      to: email, 
      subject: 'Registration Confirmation',
      html: getRegistrationConfirmMessage()
    });

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser.id,
        email: newUser.email
      },
      tokens
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user.', error });
  }
};

exports.login = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    //  Search user in the database
    const user = await User.findOne({ where: { email } });
    if(!user) return res.status(401).json({ message: 'Invalid credentials.' });

    //  Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if(!validPassword) return res.status(401).json({ message: 'Invalid credentials.' });

    //  Generate JWT tokens for the user
    const tokens = generateTokens(user);

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: 'Error logging in.', error });
  }
};

exports.refreshToken = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if(!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { refreshToken } = req.body;

  try {
    //  Check if refresh token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if(isBlacklisted) 
      return res.status(401).json({ message: 'Refresh token is blacklisted.' });

    //  Verify refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    //  Search user in the database
    const user = await User.findByPk(payload.id);
    if(!user) return res.status(404).json({ message: 'User not found.' });

    //  BLacklist the old refresh token
    const currentTime = dayjs();
    const oldTokenTTL = dayjs.unix(payload.exp).diff(currentTime, 'second');
    await blacklistToken(refreshToken, oldTokenTTL);
  
    // Generate new JWT tokens for the user 
    const tokens = generateTokens(user);

    res.json(tokens);
  } catch {
    res.status(401).json({ message: 'Invalid Refresh Token.' });
  }
};

exports.changePassword = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if(!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  try {
    //  Search user in the database
    const user = await User.findByPk(userId);
    if(!user) return res.status(404).json({ message: 'User not found.' });

    // Check if the old password matches the current password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if(!validPassword) return res.status(401).json({ message: 'Old password is incorrect.' });

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    //  Send confirmation email for change password
    sendEmail({
      to: user.email, 
      subject: 'Change Password Confirmation',
      html: getChangePasswordMessage()
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password.', error });
  }
};

exports.sendOtp = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if(!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { email } = req.body;

  try {
    //  Search user in the database
    const user = await User.findOne({ where: { email } });

    if(user) {
      //  Check if exists already an valid OTP and prevent too frequent request
      const otpTTL = await getOtpTTL(email);
      
      if(otpTTL > 3 * 60)
        return res.status(429)
          .json({ message: 'OTP request is too frequent. Please wait before requesting again.' });

      // Generate new OTP
      const otp = generateOtp();

      //  Store new OTP in Redis with a 5-minute expiry
      await storeOtp(email, otp, 5 * 60);

      // Send OTP via email
      sendEmail({
        to: email, 
        subject: 'Password Reset OTP',
        html: getOtpMessage(otp)
      });
    }
    
    res.json({ message: 'If the email is registered, an OTP has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP.', error });
  }
};

exports.verifyOtp = async(req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if(!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const { email, otp } = req.body;

  try {
    const isValid = await isOtpValid(email, otp);

    if(!isValid)
      return res.status(400).json({ message: 'Invalid or expired OTP.' });

    // Delete OTP from Redis
    await deleteOtp(email);

    //  Search user in the database
    const user = await User.findOne({ where: { email } });
    if(!user) return res.status(404).json({ message: 'User not found.' });

    //  Generate a temporary access token with a short expiry time (5 minutes)
    const token = generateTokens(user, { generateBoth: false, accessExpiry: '5m' });

    res.json(token);
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed.' });
  }
};

exports.resetPassword = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if(!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const userId = req.user.id;
  const accessToken = req.headers['authorization'].split(' ')[1];
  const { newPassword } = req.body;

  try {
    //  Search user in the database
    const user = await User.findByPk(userId);
    if(!user) return res.status(404).json({ message: 'User not found.' });

    //  Verify temporary access token
    const accessPayload = jwt.verify(accessToken, process.env.JWT_SECRET);

    // Blacklist temporary access token
    const currentTime = dayjs();
    const accessTokenTTL = dayjs.unix(accessPayload.exp).diff(currentTime, 'second');
    await blacklistToken(accessToken, accessTokenTTL);

    //  Store new password in the database
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    //  Send confirmation email for reset password
    sendEmail({
      to: user.email, 
      subject: 'Change Password Confirmation',
      html: getChangePasswordMessage()
    });

    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password.', error });
  }
};

exports.logout = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if(!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const userId = req.user.id;
  const accessToken = req.headers['authorization'].split(' ')[1];
  const { refreshToken } = req.body;

  try {
    //  Search user in the database
    const user = await User.findByPk(userId);
    if(!user) return res.status(404).json({ message: 'User not found.' });

    //  Check if refresh token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if(isBlacklisted) 
      return res.status(401).json({ message: 'Refresh token is blacklisted.' });

    //  Verify access and refresh token
    const accessPayload = jwt.verify(accessToken, process.env.JWT_SECRET);
    const refreshPayload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Blacklist both access and refresh token
    const currentTime = dayjs();
    const accessTokenTTL = dayjs.unix(accessPayload.exp).diff(currentTime, 'second');
    const refreshTokenTTL = dayjs.unix(refreshPayload.exp).diff(currentTime, 'second');

    await blacklistToken(accessToken, accessTokenTTL);
    await blacklistToken(refreshToken, refreshTokenTTL);

    res.json({ message: 'User logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out.', error });
  }
};