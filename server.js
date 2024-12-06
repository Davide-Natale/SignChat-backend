'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
//const otpRoutes = require('./routes/otpRoutes');

// Init express
const app = express();
const port = process.env.PORT

//  Set-up middlewares
app.use(morgan('dev'));
app.use(express.json());

//  Set-up routes
app.use('/api/auth', authRoutes);
//app.use('/api/otp', otpRoutes);

//  Syncronize database and activate the server
sequelize.sync().then(() => {
  console.log('Database synchronized');
  app.listen(port, () => {
    console.log(`Server http://localhost:${port}`);
  });
});
