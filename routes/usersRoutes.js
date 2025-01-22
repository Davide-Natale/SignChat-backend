'use strinct';

const express = require('express');
const { param } = require('express-validator');
const { getUser } = require('../controllers/usersController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/users/:id', authenticate, [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Id parameter must be a positive number.')
], getUser);

module.exports = router;