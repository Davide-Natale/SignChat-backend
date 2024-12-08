'use strict';

const bcrypt = require('bcrypt');
const User = require('../models/user');
const generateTokens = require('../utils/generateTokens');
const { blacklistToken, isTokenBlacklisted } = require('../utils/blacklistUtils');
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
    if (user) return res.status(409).json({ message: 'User already registered' });

    //  Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //  Add new user to database
    const newUser = await User.create({ email, password: hashedPassword });

    //  Generate JWT tokens for the user
    const tokens = generateTokens(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email
      },
      tokens
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
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
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    //  Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

    //  Generate JWT tokens for the user
    const tokens = generateTokens(user);

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

exports.refreshToken = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { refreshToken } = req.body;

  try {
    //  Check if refresh token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if(isBlacklisted) 
      res.status(401).json({ message: 'Refresh token is blacklisted' });

    //  Verify refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    //  Search user in the database
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    //  BLacklist the old refresh token
    const currentTime = dayjs();
    const oldTokenTTL = dayjs.unix(payload.exp).diff(currentTime, 'second');
    await blacklistToken(refreshToken, oldTokenTTL);
  
    // Generate new JWT tokens for the user 
    const tokens = generateTokens(user);

    res.json(tokens);
  } catch {
    res.status(401).json({ message: 'Invalid Refresh Token' });
  }
};

exports.changePassword = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  try {
    //  Search user in the database
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if the old password matches the current password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Old password is incorrect' });

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error });
  }
};

exports.logout = async (req, res) => {
  //  Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const userId = req.user.id;
  const accessToken = req.headers['authorization'].split(' ')[1];
  const { refreshToken } = req.body;

  try {
    //  Search user in the database
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    //  Check if refresh token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if(isBlacklisted) 
      res.status(401).json({ message: 'Refresh token is blacklisted' });

    //  Verify access and refresh token
    const accessPayload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const refreshPayload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Blacklist both access and refresh token
    const currentTime = dayjs();
    const accessTokenTTL = dayjs.unix(accessPayload.exp).diff(currentTime, 'second');
    const refreshTokenTTL = dayjs.unix(refreshPayload.exp).diff(currentTime, 'second');

    await blacklistToken(accessToken, accessTokenTTL);
    await blacklistToken(refreshToken, refreshTokenTTL);

    res.json({ message: 'User logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error });
  }
};