'use strict';

const express = require('express');
const { check } = require('express-validator');
const { register, login, refreshToken, changePassword, sendOtp, resetPassword, logout } = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/register', [
    check('email')
        .exists()
        .withMessage('Email parameter is required')
        .isString()
        .withMessage('Email parameter must be a string')
        .isEmail()
        .withMessage('Email parameter is not an email'),
    check('password')
        .exists()
        .withMessage('Password parameter is required')
        .isString()
        .withMessage('Password parameter must be a string')
        .isLength({ min: 8 })
        .withMessage('Password parameter must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('Password parameter must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password parameter must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password parameter must contain at least one number')
        .matches(/[@$!%*?&#]/)
        .withMessage('Password parameter must contain at least one of these special characters: @$!%*?&#')
], register);

router.post('/login', [
    check('email')
        .exists()
        .withMessage('Email parameter is required')
        .isString()
        .withMessage('Email parameter must be a string')
        .isEmail()
        .withMessage('Email parameter is not an email'),
    check('password')
        .exists()
        .withMessage('Password parameter is required')
        .isString()
        .withMessage('Password parameter must be a string')
        .notEmpty()
        .withMessage("Password parameter cannot be an empty string")
], login);

//  TODO: test blacklisting
router.post('/refresh-token', [
    check('refreshToken')
        .exists()
        .withMessage('RefreshToken parameter is required')
        .isString()
        .withMessage('RefreshToken parameter must be a string')
        .notEmpty()
        .withMessage("RefreshToken parameter cannot be an empty string")
], refreshToken);

router.post('/change-password', authenticate, [
    check('oldPassword')
        .exists()
        .withMessage('OldPassword parameter parameter is required')
        .isString()
        .withMessage('OldPassword parameter parameter must be a string')
        .notEmpty()
        .withMessage("OldPassword parameter parameter cannot be an empty string"),
    check('newPassword')
        .exists()
        .withMessage('NewPassword parameter is required')
        .isString()
        .withMessage('NewPassword parameter must be a string')
        .isLength({ min: 8 })
        .withMessage('NewPassword parameter must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('NewPassword parameter must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('NewPassword parameter must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('NewPassword parameter must contain at least one number')
        .matches(/[@$!%*?&#]/)
        .withMessage('NewPassword parameter must contain at least one of these special characters: @$!%*?&#')
], changePassword);

//  TODO: completely test these api
router.post('/reset-password/request', [
    check('email')
        .exists()
        .withMessage('Email parameter is required')
        .isString()
        .withMessage('Email parameter must be a string')
        .isEmail()
        .withMessage('Email parameter parameter is not an email')
], sendOtp);

router.post('/reset-password/confirm', [
    check('email')
        .exists()
        .withMessage('Email parameter is required')
        .isString()
        .withMessage('Email parameter must be a string')
        .isEmail()
        .withMessage('Email parameter parameter is not an email'),
    check('otp')
        .exists()
        .withMessage('Otp parameter is required')
        .isString()
        .withMessage('Otp parameter must be a string')
        .isLength({ min: 6, max: 6 })
        .withMessage('Otp parameter must be exactly 6 digits')
        .isNumeric()
        .withMessage('Otp parameter must contain only numbers.'),
    check('newPassword')
        .exists()
        .withMessage('NewPassword parameter is required')
        .isString()
        .withMessage('NewPassword parameter must be a string')
        .isLength({ min: 8 })
        .withMessage('NewPassword parameter must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('NewPassword parameter must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('NewPassword parameter must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('NewPassword parameter must contain at least one number')
        .matches(/[@$!%*?&#]/)
        .withMessage('NewPassword parameter must contain at least one of these special characters: @$!%*?&#')

], resetPassword);

router.post('/logout', authenticate, [
    check('refreshToken')
        .exists()
        .withMessage('RefreshToken parameter is required')
        .isString()
        .withMessage('RefreshToken parameter must be a string')
        .notEmpty()
        .withMessage("RefreshToken parameter cannot be an empty string")
], logout);

module.exports = router;