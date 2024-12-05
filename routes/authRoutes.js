'use strict';

const express = require('express');
const { register, login, refreshToken, changePassword, getProfile } = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/change-password', authenticate, changePassword);

//  TODO: move somewhere else
router.get('/profile', authenticate, getProfile);

module.exports = router;
