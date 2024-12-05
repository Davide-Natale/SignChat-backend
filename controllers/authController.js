'use strict';

const bcrypt = require('bcrypt');
const User = require('../models/user');
const generateTokens = require('../utils/generateTokens');
const { verify } = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    //  Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //  Create add user to database
    const user = await User.create({ email, password: hashedPassword });

    //  Generate JWT tokens for the user
    const tokens = generateTokens(user);

    res.status(201).json({ 
        message: 'User registered successfully', 
        user: {
            id: user.id,
            email: user.email
        },
        tokens
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    //  Search user in the database
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    //  Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

    //  Generate JWT tokens for the user
    const tokens = generateTokens(user);

    res.status(200).json(tokens);
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    //  Verify refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    //  Search user in the database
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate new JWT tokens for the user 
    const tokens = generateTokens(user);
    
    res.status(200).json(tokens);
  } catch {
    res.status(401).json({ message: 'Invalid Refresh Token' });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

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

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error });
  }
};

//  TODO: move somewhere else
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    //  Search user in the database
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error });
  }
};
