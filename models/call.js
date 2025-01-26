'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Call = sequelize.define('Call', {
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
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('incoming', 'outgoing'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('completed', 'missed', 'unanswered', 'rejected'),
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    contactId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Contacts',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    }
}, {
        timestamps: false
    }
);

module.exports = Call;