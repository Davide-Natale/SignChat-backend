'use strict';

const nodemailer = require('nodemailer');

const sendEmail = async (mailOptions) => {
  const { to, subject, html } = mailOptions;

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({ from: "SignChat" + " " + process.env.EMAIL_USER, to, subject, html });
};

const getRegistrationConfirmMessage = () => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0a7ea4;">Registration Confirmed</h2>
      </div>
      <p style="margin: 0 0 16px;">Thank you for registering with our service! Your account has been successfully created.</p>
      <p style="margin: 0 0 16px;">You can now log in and start using your account.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #5f6368; text-align: center;">This is an automated message. Please do not reply.</p>
    </div>
  `;
}

const getOtpMessage = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0a7ea4;">Password Reset Request</h2>
      </div>
      <p style="margin: 0 0 16px;">We received a request to reset your password. Please use the code below to complete the process:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; color: #0a7ea4;">${otp}</span>
      </div>
      <p style="margin: 0 0 16px;"><strong>Note:</strong> This code will expire in <strong>5 minutes</strong>.</p>
      <p style="margin: 0 0 16px;">If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #5f6368; text-align: center;">This is an automated message. Please do not reply.</p>
    </div>
    `;
}

const getChangePasswordMessage = () => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0a7ea4;">Change Password Confirmed</h2>
      </div>
      <p style="margin: 0 0 16px;">Your password has been successfully changed.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #5f6368; text-align: center;">This is an automated message. Please do not reply.</p>
    </div>
    `;
}

const getDeleteAccountMessage = () => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #d9534f;">Account Deletion Confirmed</h2>
      </div>
      <p style="margin: 0 0 16px;">We're sorry to see you go. Your account has been scheduled for deletion.</p>
      <p style="margin: 0 0 16px;"><strong>Important:</strong> Once your account is deleted, all related data and services will be lost.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #5f6368; text-align: center;">This is an automated message. Please do not reply.</p>
    </div>
    `;
}
module.exports = { sendEmail, getRegistrationConfirmMessage, getOtpMessage, getChangePasswordMessage, getDeleteAccountMessage };
