'use strict';

const User = require('./user');
const Contact = require('./contact');
const Call = require('./call');

//  User model's associations
User.hasMany(Contact, { foreignKey: 'ownerId', as: 'contacts' });
User.hasMany(Call, { foreignKey: 'ownerId', as: 'calls' });

//  Contact model's associations
Contact.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Contact.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Contact.hasMany(Call, { foreignKey: 'contactId', sourceKey: 'id', as: 'calls' });
Contact.hasMany(Call, { foreignKey: 'contactOwnerId', sourceKey: 'ownerId' });

//  Calls model's associations
Call.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Call.belongsTo(User, { foreignKey: 'userId', targetKey: 'id', as: 'user', onDelete: 'SET NULL' });
Call.belongsTo(Contact, { foreignKey: 'contactId', targetKey: 'id', as: 'contact' });
Call.belongsTo(Contact, { foreignKey: 'contactOwnerId', targetKey: 'ownerId' });