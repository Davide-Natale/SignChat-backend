'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Token = sequelize.define('Token', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    fcmToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

module.exports = Token;