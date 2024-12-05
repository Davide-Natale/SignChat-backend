'use strict';

/*const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/user');

const otps = new Map(); // In-memory storage for OTPs

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    //  Search user in the database
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = crypto.randomInt(100000, 999999).toString();
    otps.set(email, otp);

    await sendEmail(email, 'Your OTP Code', `Your OTP code is ${otp}`);
    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const storedOtp = otps.get(email);
    if (storedOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { email } });

    otps.delete(email);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error });
  }
};

// Send OTP for password reset
exports.sendResetOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate OTP and send via email
    const otp = crypto.randomInt(100000, 999999).toString();
    otps.set(email, otp);

    await sendEmail(email, 'Password Reset OTP', `Your OTP code for password reset is ${otp}`);
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error });
  }
};

// Verify OTP and allow the user to reset their password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const storedOtp = otps.get(email);
    if (storedOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { email } });

    otps.delete(email); // Remove the OTP from the map
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error });
  }
};

*/

// TODO: check implementation and align using Redis
