import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'vimpl API',
            version: '1.0.0',
            description: 'REST API for vimpl visual planning boards — manage boards, sections, post-its, and event logs.',
            contact: {
                name: 'vimpl',
                url: 'https://vimpl.com',
            },
        },
        servers: [
            {
                url: '/api/v1',
                description: 'API v1',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT access token',
                },
            },
            schemas: {
                Board: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        title: { type: 'string' },
                        slug: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        gridData: { type: 'object' },
                        settings: { type: 'object' },
                        version: { type: 'integer' },
                        isPublic: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        lastAccessedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Section: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        boardId: { type: 'string', format: 'uuid' },
                        type: { type: 'string', enum: ['text', 'matrix', 'weekplan', 'kpi', 'actions', 'postit-area', 'team'] },
                        title: { type: 'string', nullable: true },
                        positionX: { type: 'integer', nullable: true },
                        positionY: { type: 'integer', nullable: true },
                        width: { type: 'integer', nullable: true },
                        height: { type: 'integer', nullable: true },
                        content: { type: 'object' },
                        isLocked: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Postit: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        sectionId: { type: 'string', format: 'uuid' },
                        boardId: { type: 'string', format: 'uuid' },
                        color: { type: 'string', enum: ['yellow', 'pink', 'blue', 'green', 'orange'] },
                        content: { type: 'string', nullable: true },
                        owner: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['todo', 'inprogress', 'done'] },
                        positionX: { type: 'number', nullable: true },
                        positionY: { type: 'number', nullable: true },
                        xValue: { type: 'integer', nullable: true },
                        yValue: { type: 'integer', nullable: true },
                        riskScore: { type: 'integer', nullable: true },
                        mitigation: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                EventLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        boardId: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid', nullable: true },
                        eventType: { type: 'string' },
                        elementId: { type: 'string', format: 'uuid', nullable: true },
                        elementType: { type: 'string', nullable: true },
                        details: { type: 'object', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
            responses: {
                Unauthorized: {
                    description: 'Authentication required',
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/Error' },
                        },
                    },
                },
                Forbidden: {
                    description: 'Access denied',
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/Error' },
                        },
                    },
                },
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/Error' },
                        },
                    },
                },
                BadRequest: {
                    description: 'Invalid request data',
                    content: {
                        'application/json': {
                            schema: { '$ref': '#/components/schemas/Error' },
                        },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentication and user management' },
            { name: 'Boards', description: 'Board CRUD operations' },
            { name: 'Sections', description: 'Board section management' },
            { name: 'Post-its', description: 'Post-it note management' },
            { name: 'Event Log', description: 'Board activity history' },
            { name: 'Leads', description: 'Contact / interest form submissions' },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
