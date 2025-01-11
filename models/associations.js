'use strict';

const User = require('./user');
const Contact = require('./contact');

//  User model's associations
User.hasMany(Contact, { foreignKey: 'ownerId', as: 'contacts' });

//  Contact model's associations
Contact.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Contact.belongsTo(User, { foreignKey: 'userId', as: 'user' });