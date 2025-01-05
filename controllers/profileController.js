'use strict';

const { Sequelize } = require('sequelize');
const User = require('../models/user');
const { sendEmail, getDeleteAccountMessage } = require('../utils/emailUtils');
const { blacklistToken, isTokenBlacklisted } = require('../utils/blacklistUtils');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const fs = require('fs');

exports.getProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) return res.status(404).json({ message: 'User not found.' });

        res.json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            imageProfile: user.imageProfile
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile.', error });
    }
};

exports.updateProfile = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if(!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const { firstName, lastName, email, phone } = req.body;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) res.status(404).json({ message: 'User not found.' });

        //  Check if email is already used
        const checkEmail = await User.findOne({
            where: {
                email,
                id: { [Sequelize.Op.ne]: userId }
            }
        });

        if(checkEmail) return res.status(409).json({ message: 'Email already exists.' });

        //  Check if phone number is already used
        const checkPhone = await User.findOne({
            where: {
                phone,
                id: { [Sequelize.Op.ne]: userId }
            }
        });

        if(checkPhone) return res.status(409).json({ message: 'Phone number already exists.' });

        await user.update({ firstName, lastName, email, phone });

        res.json({
            message: 'Profile updated successfully.',
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                imageProfile: user.imageProfile
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile.', error });
    }
};

exports.deleteProfile = async (req, res) => {
    //  Check validation results
    const errors = validationResult(req);
    if(!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const userId = req.user.id;
    const accessToken = req.headers['authorization'].split(' ')[1];
    const { refreshToken } = req.body;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) return res.status(404).json({ message: 'User not found.' });

        //  Check if refresh token is blacklisted
        const isBlacklisted = await isTokenBlacklisted(refreshToken);
        if(isBlacklisted) 
            return res.status(401).json({ message: 'Refresh token is blacklisted.' });

        //  Verify access and refresh token
        const accessPayload = jwt.verify(accessToken, process.env.JWT_SECRET);
        const refreshPayload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        //  Save user email before deletion to send email confirmation
        const email = user.email;

        //  Delete profile image if exists
        if(user.imageProfile) {
            const imageFileName = user.imageProfile.split('/uploads')[1];
            const imageFilePath = '../uploads' + imageFileName;

            if(fs.existsSync(imageFilePath)) {
                fs.unlinkSync(imageFilePath);
            }
        } 

        //  Delete user from database
        await user.destroy();

        // Blacklist both access and refresh token
        const currentTime = dayjs();
        const accessTokenTTL = dayjs.unix(accessPayload.exp).diff(currentTime, 'second');
        const refreshTokenTTL = dayjs.unix(refreshPayload.exp).diff(currentTime, 'second');

        await blacklistToken(accessToken, accessTokenTTL);
        await blacklistToken(refreshToken, refreshTokenTTL);

        
        //  Send confirmation email for profile delation
        sendEmail({
            to: email, 
            subject: 'Account Deletion Confirmation',
            html: getDeleteAccountMessage()
          });

        res.json({ message: 'Profile deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting profile.', error });
    }
};

exports.uploadProfileImage = async (req, res) => {
    const userId = req.user.id;

    if(!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const imagePath = req.file.path;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) return res.status(404).json({ message: 'User not found.' });

        //  Delete old profile image, if exists
        if(user.imageProfile) {
            const imageFileName = user.imageProfile.split('/uploads')[1];
            const imageFilePath = '../uploads' + imageFileName;

            if(fs.existsSync(imageFilePath)) {
                fs.unlinkSync(imageFilePath);
            }
        }

        //  Update user
        await user.update({ imageProfile: imagePath });

        res.json({ message: 'Profile image uploaded successfully.'});
    } catch (error) {
        res.status(500).json({ message: 'Error uploading profile image.', error });
    }
};

exports.deleteProfileImage = async (req, res) => {
    const userId = req.user.id;

    try {
        //  Search user in the database
        const user = await User.findByPk(userId);
        if(!user) return res.status(404).json({ message: 'User not found.' });

        //  Check if user has a profile image
        if(!user.imageProfile) {
            return res.status(400).json({ message: 'No profile image to delete.' });
        }

        //  Delete profile image file
        const imageFileName = user.imageProfile.split('/uploads')[1];
        const imageFilePath = '../uploads' + imageFileName;

        if(fs.existsSync(imageFilePath)) {
            fs.unlinkSync(imageFilePath);
        }

        //  Update user
        await user.update({ imageProfile: null });

        res.json({ message: 'Profile image deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Errod deleting profile image.' });
    }
};