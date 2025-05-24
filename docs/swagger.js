'use strict';

const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API RESTful documentation for SignChat backend.',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Email: {
          type: 'string',
          format: 'email',
          description: 'Valid email address',
          example: 'test1@example.com'
        },
        Password: {
          type: 'string',
          minLength: 8,
          description:'Password at least 8 characters long and containing at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&#)',
          example: 'Aa0?aaaa'
        },
        Tokens: {
          type: 'object',
          required: ['accessToken', 'refreshToken'],
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        Id: {
          type: 'integer',
          description: 'Unique numeric identifier',
          minimum: 1,
          example: 1
        },
        ImageProfile: {
          type: 'string',
          format: 'uri',
          nullable: true,
          description: 'Profile image url if exists or null',
          example: 'https://cfmrgxvkgbvnzeznsdgf.supabase.co/storage/v1/object/public/uploads/images/ef7683d9-be8d-4452-a448-2f0bf8dc2308.png'
        },
        User: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'phone', 'imageProfile'],
          properties: {
            firstName: {
              type: 'string',
              example: 'John'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            email: {
              $ref: '#/components/schemas/Email'
            },
            phone: {
              type: 'string',
              example: '1234567890'
            }
          }
        },
        FcmToken: {
          type: 'object',
          required: ['deviceId', 'fcmToken'],
          properties: {
            deviceId: { type: 'string' },
            fcmToken: { type: 'string' }
          }
        },
        Message: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          required: ['message', 'error'],
          properties: {
            message: { type: 'string' },
            error: { type: 'object' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;