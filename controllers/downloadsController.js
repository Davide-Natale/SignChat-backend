'use strict';

const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

exports.getApp = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const version = req.query.version || 'latest';
    const downloadsDir = path.join(__dirname, '..', 'downloads');
    const fileName = `SignChat-${version === 'latest' ? version : `v${version}`}.apk`;
    const filePath = path.join(downloadsDir, fileName);

    if(!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found.' });
    }

    res.download(filePath);
};