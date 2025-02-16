const Token = require('../models/token');
const { validationResult } = require('express-validator');

exports.createToken = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { deviceId, fcmToken } = req.body;

    try {
        //  Check if token already exists
        const token = await Token.findOne({
            where: { fcmToken, ownerId: userId }
        });

        if(token) {
            return res.status(409).json({ message: 'Token already exists.' });
        }

        //  Add new token to database
        const newToken = await Token.create({ fcmToken, deviceId, ownerId: userId });

        res.status(201).json({
            message: 'Token created successfully.',
            token: {
                id: newToken.id,
                deviceId: newToken.deviceId,
                fcmToken: newToken.fcmToken
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating token.', error });
    }
};

exports.syncToken = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { deviceId, fcmToken } = req.body;

    try {
        //  Check if token already exists
        const token = await Token.findOne({
            where: { deviceId, ownerId: userId }
        });

        if(!token) {
            return res.status(404).json({ message: 'Token not found.' });
        }

        await token.update({ fcmToken });

        res.json({
            message: 'Token synched successfully.',
            token: {
                id: token.id,
                deviceId: token.deviceId,
                fcmToken: token.fcmToken
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error synching token.', error });
    }
};

exports.deleteToken = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { fcmToken } = req.body;

    try {
        //  Search token in the database
        const token = await Token.findOne({
            where: { fcmToken, ownerId: userId }
        });

        if(!token) {
            return res.status(404).json({ message: 'Token not found.' });
        }

        //  Delete token from database
        await token.destroy();

        res.json({ message: 'Token deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting token.', error });
    }
};