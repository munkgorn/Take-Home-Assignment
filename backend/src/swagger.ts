import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Meeting Scheduler API',
    version: '1.0.0',
    description: 'REST API for scheduling candidate meetings',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Development' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 6, example: 'password123' },
          name: { type: 'string', example: 'John Doe' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
        },
      },
      CreateMeeting: {
        type: 'object',
        required: ['title', 'candidateName', 'position', 'meetingType', 'startTime', 'endTime'],
        properties: {
          title: { type: 'string', example: 'Technical Interview' },
          candidateName: { type: 'string', example: 'Jane Doe' },
          position: { type: 'string', example: 'Senior Engineer' },
          meetingType: { type: 'string', enum: ['online', 'onsite'], example: 'online' },
          startTime: { type: 'string', format: 'date-time', example: '2026-03-15T10:00:00.000Z' },
          endTime: { type: 'string', format: 'date-time', example: '2026-03-15T11:00:00.000Z' },
          description: { type: 'string', example: 'Technical interview for senior position' },
          meetingLink: { type: 'string', format: 'uri', example: 'https://zoom.us/j/123456' },
          notes: { type: 'string', example: 'Prepare system design questions' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
        },
      },
      UpdateMeeting: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          candidateName: { type: 'string' },
          position: { type: 'string' },
          meetingType: { type: 'string', enum: ['online', 'onsite'] },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          description: { type: 'string' },
          meetingLink: { type: 'string' },
          notes: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
        },
      },
      Meeting: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          candidateName: { type: 'string' },
          position: { type: 'string' },
          meetingType: { type: 'string', enum: ['online', 'onsite'] },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          description: { type: 'string', nullable: true },
          meetingLink: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
          userId: { type: 'string', format: 'uuid' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedMeetings: {
        type: 'object',
        properties: {
          meetings: { type: 'array', items: { $ref: '#/components/schemas/Meeting' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          '201': { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          '409': { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with credentials',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/meetings': {
      get: {
        tags: ['Meetings'],
        summary: 'List meetings with pagination, search, and filter',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 }, description: 'Items per page' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] }, description: 'Filter by status' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by title or candidate name' },
        ],
        responses: {
          '200': { description: 'Paginated list of meetings', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedMeetings' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Meetings'],
        summary: 'Create a new meeting',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMeeting' } } },
        },
        responses: {
          '201': { description: 'Meeting created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Meeting' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/meetings/{id}': {
      get: {
        tags: ['Meetings'],
        summary: 'Get a meeting by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Meeting ID' },
        ],
        responses: {
          '200': { description: 'Meeting details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Meeting' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Meeting not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Meetings'],
        summary: 'Update a meeting',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Meeting ID' },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMeeting' } } },
        },
        responses: {
          '200': { description: 'Meeting updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Meeting' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Meeting not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Meetings'],
        summary: 'Soft-delete a meeting',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Meeting ID' },
        ],
        responses: {
          '204': { description: 'Meeting deleted' },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Meeting not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  swaggerDefinition,
  apis: [],
});
