'use strict';

const express = require('express');
const { query } = require('express-validator');
const { getApp } = require('../controllers/downloadsController');

const router = express.Router();

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