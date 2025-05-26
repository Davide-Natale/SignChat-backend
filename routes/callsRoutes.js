'use strict';

const express = require('express');
const { body, query, param } = require('express-validator');
const { getCalls, getCall, deleteCalls } = require('../controllers/callsController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /calls:
 *   get:
 *     summary: Get all calls
 *     description: Retreive all calls that belong to the authenticated user
 *     tags:
 *       - Calls
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         required: false
 *         description: Filter calls by contact id
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         required: false
 *         description: Filter calls by user id
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 5
 *         required: false
 *         description: Maximum number of calls to return
 *     responses:
 *       200:
 *         description: List of calls associated to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - calls
 *               properties:
 *                 calls:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Call'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       422:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /calls/{id}:
 *   get:
 *     summary: Get call by id
 *     description: Retreive a specific call by id that belong to the authenticated user
 *     tags:
 *       - Calls
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/Id'
 *     responses:
 *       200:
 *         description: Call information associated to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - call
 *               properties:
 *                 call:
 *                   $ref: '#/components/schemas/Call'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: Call not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       422:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/calls/:id', authenticate, [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Id parameter must be a positive number.')
], getCall);

/**
 * @swagger
 * /calls/:
 *   delete:
 *     summary: Delete calls by id
 *     description: Delete a list of calls by id that belong to the authenticated user
 *     tags:
 *       - Calls
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: List of call ids to be deleted (cannot be empty)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Id'
 *     responses:
 *       200:
 *         description: Calls deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       422:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/calls', authenticate, [
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