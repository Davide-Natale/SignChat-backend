'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING
  },
  lastName: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  isDeaf: {
    type: DataTypes.BOOLEAN
  }
},
  {
    timestamps: false,
  }
);

module.exports = User;