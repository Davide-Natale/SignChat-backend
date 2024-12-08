'use strict';

const { Sequelize } = require('sequelize');
const User = require('../models/user');
const { blacklistToken, isTokenBlacklisted } = require('../utils/blacklistUtils');

exports.getProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isDeaf: user.isDeaf
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, isDeaf } = req.body;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if (!user) res.status(404).json({ message: 'User not found' });

        //  Check if email is already used
        const checkEmail = await User.findOne({
            where: {
                email,
                id: { [Sequelize.Op.ne]: userId }
            }
        });

        if (checkEmail) res.status(409).json({ message: 'Email already exists' });

        //  Check if phone number is already used
        const checkPhone = await User.findOne({
            where: {
                phone,
                id: { [Sequelize.Op.ne]: userId }
            }
        });

        if (checkPhone) res.status(409).json({ message: 'Phone number already exists' });

        await user.update({ firstName, lastName, email, phone, isDeaf });

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                isDeaf: user.isDeaf
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error });
    }
};

exports.deleteProfile = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const accessToken = req.headers['authorization'].split(' ')[1];
    const { refreshToken } = req.body;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if (!user) res.status(404).json({ message: 'User not found' });

        //  Check if refresh token is blacklisted
        if(isTokenBlacklisted(refreshToken)) 
            res.status(401).json({ message: 'Refresh token is blacklisted' });

        //  Verify access and refresh token
        const accessPayload = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const refreshPayload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        //  Delete user from database
        await user.destroy();

        // Blacklist both access and refresh token
        const currentTime = dayjs();
        const accessTokenTTL = dayjs.unix(accessPayload.exp).diff(currentTime, 'second');
        const refreshTokenTTL = dayjs.unix(refreshPayload.exp).diff(currentTime, 'second');

        await blacklistToken(accessToken, accessTokenTTL);
        await blacklistToken(refreshToken, refreshTokenTTL);

        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting profile', error: error });
    }
};