'use strict';

const express = require('express');
const { query } = require('express-validator');
const { getApp } = require('../controllers/downloadsController');

const router = express.Router();

/**
 * @swagger
 * /downloads/app:
 *   get:
 *     summary: Get app apk file
 *     description: Retrieve a specific or latest(default) version of app apk file
 *     tags:
 *       - Downloads
 *     parameters:
 *       - in: query
 *         name: version
 *         required: false
 *         schema:
 *           type: string
 *           description: Version of the APK (e.g., 1.0.0 or "latest")
 *           example: latest
 *     responses:
 *       200:
 *         description: APK file successfully returned
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       422:
 *         description: Invalid parameters
 */
router.get('/downloads/app', [
    query('version')
        .optional()
        .custom(value => {
            if(value === 'latest' || /^\d+\.\d+\.\d+$/.test(value)) {
                return true;
            }

            throw new Error('Invalid version.');
        })
], getApp);

module.exports = router;