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
        Contact: {
          type: 'object',
          required: ['firstName', 'lastName', 'phone'],
          properties: {
            firstName: {
              type: 'string',
              example: 'Emily'
            },
            lastName: {
              type: 'string',
              nullable: true,
              example: 'Carter'
            },
            phone: {
              type: 'string',
              example: '9876543210'
            }
          }
        },
        Call: {
          type: 'object',
          required: [
            'id',
            'phone',
            'type',
            'status',
            'date',
            'duration',
            'contact',
            'user',
          ],
          properties: {
            id: { $ref: '#/components/schemas/Id' },
            phone: {
              type: 'string',
              example: '9876543210',
            },
            type: {
              type: 'string',
              enum: ['incoming', 'outgoing'],
              example: 'incoming',
            },
            status: {
              type: 'string',
              enum: ['completed', 'missed', 'unanswered', 'rejected', 'ongoing'],
              example: 'missed',
            },
            date: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-07T11:45:10.000Z',
            },
            duration: {
              type: 'integer',
              example: 0,
            },
            contact: {
              nullable: true,
              allOf: [
                {
                  type: 'object',
                  required: ['id'],
                  properties: {
                    id: { $ref: '#/components/schemas/Id' }
                  },
                },
                { $ref: '#/components/schemas/Contact' },
                {
                  type: 'object',
                  required: ['user'],
                  properties: {
                    user: {
                      nullable: true,
                      type: 'object',
                      required: ['id', 'imageProfile'],
                      properties: {
                        id: { $ref: '#/components/schemas/Id' },
                        imageProfile: { $ref: '#/components/schemas/ImageProfile' },
                      },
                    },
                  },
                },
              ],
            },
            user: {
              nullable: true,
              type: 'object',
              required: ['id', 'firstName', 'lastName', 'phone', 'imageProfile'],
              properties: {
                id: { $ref: '#/components/schemas/Id' },
                firstName: {
                  type: 'string',
                  example: 'Emily',
                },
                lastName: {
                  type: 'string',
                  example: 'Carter',
                },
                phone: {
                  type: 'string',
                  example: '9876543210',
                },
                imageProfile: { $ref: '#/components/schemas/ImageProfile' },
              },
              example: null
            },
          },
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