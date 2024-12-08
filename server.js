'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const redisClient = require('./config/redisClient');
//const otpRoutes = require('./routes/otpRoutes');

// Init express
const app = express();
const port = process.env.PORT

//  Set-up middlewares
app.use(morgan('dev'));
app.use(express.json());

//  Set-up routes
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
//app.use('/api/otp', otpRoutes);

(async () => {
  try {
    //  Connect to Redis
    await redisClient.connect();

    // Synchronize database
    await sequelize.sync();

    // Activate server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error initializing server:', error);
    process.exit(1);
  }
})();