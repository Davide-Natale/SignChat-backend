'use strict';

const express = require('express');
const { body } = require('express-validator');
const { register, login, refreshToken, changePassword, sendOtp, resetPassword, verifyOtp, logout } = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/register', [
    body('email')
        .exists()
        .withMessage('Email parameter is required.')
        .isString()
        .withMessage('Email parameter must be a string.')
        .isEmail()
        .withMessage('Email parameter is not an email.'),
    body('password')
        .exists()
        .withMessage('Password parameter is required.')
        .isString()
        .withMessage('Password parameter must be a string.')
        .isLength({ min: 8 })
        .withMessage('Password parameter must be at least 8 characters long.')
        .matches(/[A-Z]/)
        .withMessage('Password parameter must contain at least one uppercase letter.')
        .matches(/[a-z]/)
        .withMessage('Password parameter must contain at least one lowercase letter.')
        .matches(/[0-9]/)
        .withMessage('Password parameter must contain at least one number.')
        .matches(/[@$!%*?&#]/)
        .withMessage('Password parameter must contain at least one of these special characters: @$!%*?&#.')
], register);

router.post('/login', [
    body('email')
        .exists()
        .withMessage('Email parameter is required.')
        .isString()
        .withMessage('Email parameter must be a string.')
        .isEmail()
        .withMessage('Email parameter is not an email.'),
    body('password')
        .exists()
        .withMessage('Password parameter is required.')
        .isString()
        .withMessage('Password parameter must be a string.')
        .notEmpty()
        .withMessage("Password parameter cannot be an empty string.")
], login);

router.post('/refresh-token', [
    body('refreshToken')
        .exists()
        .withMessage('RefreshToken parameter is required.')
        .isString()
        .withMessage('RefreshToken parameter must be a string.')
        .notEmpty()
        .withMessage("RefreshToken parameter cannot be an empty string.")
], refreshToken);

router.post('/change-password', authenticate, [
    body('oldPassword')
        .exists()
        .withMessage('OldPassword parameter parameter is required.')
        .isString()
        .withMessage('OldPassword parameter parameter must be a string.')
        .notEmpty()
        .withMessage("OldPassword parameter parameter cannot be an empty string."),
    body('newPassword')
        .exists()
        .withMessage('NewPassword parameter is required.')
        .isString()
        .withMessage('NewPassword parameter must be a string.')
        .isLength({ min: 8 })
        .withMessage('NewPassword parameter must be at least 8 characters long.')
        .matches(/[A-Z]/)
        .withMessage('NewPassword parameter must contain at least one uppercase letter.')
        .matches(/[a-z]/)
        .withMessage('NewPassword parameter must contain at least one lowercase letter.')
        .matches(/[0-9]/)
        .withMessage('NewPassword parameter must contain at least one number.')
        .matches(/[@$!%*?&#]/)
        .withMessage('NewPassword parameter must contain at least one of these special characters: @$!%*?&#.')
], changePassword);

router.post('/reset-password/request', [
    body('email')
        .exists()
        .withMessage('Email parameter is required.')
        .isString()
        .withMessage('Email parameter must be a string.')
        .isEmail()
        .withMessage('Email parameter parameter is not an email.')
], sendOtp);

router.post('/reset-password/verify-otp', [
    body('email')
        .exists()
        .withMessage('Email parameter is required.')
        .isString()
        .withMessage('Email parameter must be a string.')
        .isEmail()
        .withMessage('Email parameter parameter is not an email.'),
    body('otp')
        .exists()
        .withMessage('Otp parameter is required.')
        .isString()
        .withMessage('Otp parameter must be a string.')
        .isLength({ min: 6, max: 6 })
        .withMessage('Otp parameter must be exactly 6 digits.')
        .isNumeric()
        .withMessage('Otp parameter must contain only numbers.'),
], verifyOtp);

router.post('/reset-password/confirm', authenticate, [
    body('newPassword')
        .exists()
        .withMessage('NewPassword parameter is required.')
        .isString()
        .withMessage('NewPassword parameter must be a string.')
        .isLength({ min: 8 })
        .withMessage('NewPassword parameter must be at least 8 characters long.')
        .matches(/[A-Z]/)
        .withMessage('NewPassword parameter must contain at least one uppercase letter.')
        .matches(/[a-z]/)
        .withMessage('NewPassword parameter must contain at least one lowercase letter.')
        .matches(/[0-9]/)
        .withMessage('NewPassword parameter must contain at least one number.')
        .matches(/[@$!%*?&#]/)
        .withMessage('NewPassword parameter must contain at least one of these special characters: @$!%*?&#.')
], resetPassword);

router.post('/logout', authenticate, [
    body('refreshToken')
        .exists()
        .withMessage('RefreshToken parameter is required.')
        .isString()
        .withMessage('RefreshToken parameter must be a string.')
        .notEmpty()
        .withMessage("RefreshToken parameter cannot be an empty string.")
], logout);

router.post('/verify', authenticate, (_req, res) => {
    res.json({ message: "User is authenticated" })
});
    
module.exports = router;