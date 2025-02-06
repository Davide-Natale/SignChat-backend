const Token = require('../models/token');
const { validationResult } = require('express-validator');

exports.createToken = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { expoToken } = req.body;

    try {
        //  Check if token already exists
        const token = await Token.findOne({
            where: { expoToken, ownerId: userId }
        });

        if(token) {
            return res.status(409).json({ message: 'Token already exists.' });
        }

        //  Add new token to database
        const newToken = await Token.create({ expoToken, ownerId: userId });

        res.status(201).json({
            message: 'Token created successfully.',
            token: {
                id: newToken.id,
                expoToken: newToken.expoToken
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating token.', error });
    }
};

exports.deleteToken = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { expoToken } = req.body;

    try {
        //  Search token in the database
        const token = await Token.findOne({
            where: { expoToken, ownerId: userId }
        });

        if(!token) {
            return res.status(404).json({ message: 'Token not found.' });
        }

        //  Delete token from database
        await token.destroy();

        res.json({ message: 'Token deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating token.', error });
    }
};