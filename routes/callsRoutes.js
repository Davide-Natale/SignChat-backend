'use strict';

const express = require('express');
const { body, query, param } = require('express-validator');
const { getCalls, getCall, deleteCalls } = require('../controllers/callsController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/calls', authenticate, [
    query('contactId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ContactId parameter must be a positive numeric id.'),
    query('userId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('UserId parameter must be a positive numeric id.'),
    query('limit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Limit parameter must be a positive number.')
], getCalls);

router.get('/calls/:id', authenticate, [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Id parameter must be a positive number.')
], getCall);

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