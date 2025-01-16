'use strict';

const express = require('express');
const { body, query } = require('express-validator');
const { getCalls, deleteCalls } = require('../controllers/callsController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/calls', authenticate, [
    query('contactId')
        .optional()
        .isUUID()
        .withMessage('ContactId parameter must be a valid UUID.'),
    query('userId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('UserId parameter must be a positive numeric id.'),
    query('limit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Limit parameter must be a positive number.')
], getCalls);

router.delete('/calls/', authenticate, [
    body('ids')
        .exists()
        .withMessage('Ids parameter is required.')
        .isArray()
        .withMessage('Ids parameter must be an array.')
        .custom((ids) => ids.length > 0)
        .withMessage('Ids cannot be empty'),
    body('ids.*')
        .isInt({ min: 1 })
        .withMessage('Ids must contain only positive numeric id.')
], deleteCalls);

module.exports = router;