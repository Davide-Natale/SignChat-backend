'use strinct';

const express = require('express');
const { param } = require('express-validator');
const { getUser } = require('../controllers/usersController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by id 
 *     description: Retrieve user information given its id
 *     tags:
 *       - Users
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
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     id: 
 *                       $ref: '#/components/schemas/Id'
 *                   required: 
 *                     - id
 *                 - type: object
 *                   required: 
 *                     - firstName
 *                     - lastName
 *                     - phone
 *                     - imageProfile
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     phone: 
 *                       type: string
 *                       example: 1234567890
 *                     imageProfile:
 *                       $ref: '#/components/schemas/ImageProfile'
 *       401:
 *         description: User unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: User not found
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
router.get('/users/:id', authenticate, [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Id parameter must be a positive number.')
], getUser);

module.exports = router;