import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'vimpl API',
            version: '1.0.0',
            description: `REST API for vimpl visual planning boards.

## Authentication
All protected endpoints require a JWT Bearer token in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`
Obtain a token via \`POST /auth/login\` or \`POST /auth/refresh\`.

## Voice-to-BPMN Integration
The \`POST /boards/import\` endpoint accepts a \`ProjectPlan\` exported from the
voice-2-bpmn tool and creates a fully populated board in one atomic operation.`,
            contact: {
                name: 'vimpl',
                url: 'https://vimpl.com',
            },
        },
        servers: [
            {
                url: '/api/v1',
                description: 'API v1 — local development (http://localhost:3001/api/v1)',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Access token obtained from POST /auth/login',
                },
            },
            schemas: {
                // ─── Core domain models ───────────────────────────────────────────
                Board: {
                    type: 'object',
                    description: 'A visual planning board owned by a user.',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        title: { type: 'string', example: 'Invoice Approval Process' },
                        slug: { type: 'string', example: 'invoice-approval-process' },
                        description: { type: 'string', nullable: true },
                        gridData: { type: 'object', description: 'Free-form grid layout metadata' },
                        settings: { type: 'object', description: 'Board display settings' },
                        version: { type: 'integer', description: 'Optimistic-locking version counter', example: 1 },
                        isPublic: { type: 'boolean', default: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        lastAccessedAt: { type: 'string', format: 'date-time', nullable: true },
                    },
                },
                Section: {
                    type: 'object',
                    description: 'A typed content block within a board.',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        boardId: { type: 'string', format: 'uuid' },
                        type: {
                            type: 'string',
                            enum: ['text', 'matrix', 'weekplan', 'kpi', 'actions', 'postit-area', 'team'],
                            description: '`weekplan` is used for project plans imported from voice-2-bpmn',
                        },
                        title: { type: 'string', nullable: true },
                        positionX: { type: 'integer', nullable: true },
                        positionY: { type: 'integer', nullable: true },
                        width: { type: 'integer', nullable: true },
                        height: { type: 'integer', nullable: true },
                        content: {
                            type: 'object',
                            description: 'Type-specific content. For `weekplan`: `{ tracks, weeks, startDate }`.',
                            oneOf: [
                                { $ref: '#/components/schemas/WeekplanContent' },
                            ],
                        },
                        isLocked: { type: 'boolean', default: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                WeekplanContent: {
                    type: 'object',
                    description: 'Content shape for sections with type=weekplan.',
                    required: ['tracks', 'weeks', 'startDate'],
                    properties: {
                        tracks: {
                            type: 'array',
                            description: 'Swim-lane tracks (e.g., Technology, Process, People)',
                            items: { $ref: '#/components/schemas/Track' },
                        },
                        weeks: {
                            type: 'integer',
                            description: 'Total duration of the plan in weeks',
                            minimum: 1,
                            example: 10,
                        },
                        startDate: {
                            type: 'string',
                            format: 'date',
                            description: 'ISO 8601 date the plan starts (YYYY-MM-DD)',
                            example: '2026-03-13',
                        },
                    },
                },
                Postit: {
                    type: 'object',
                    description: 'A sticky note within a board section.',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        sectionId: { type: 'string', format: 'uuid' },
                        boardId: { type: 'string', format: 'uuid' },
                        color: {
                            type: 'string',
                            enum: ['yellow', 'pink', 'blue', 'green', 'orange'],
                            description: 'In weekplan imports, colour is assigned by track index (0→yellow, 1→blue, 2→green, 3→pink, 4→orange)',
                        },
                        content: { type: 'string', nullable: true, example: 'Automate PO matching\nWk 1–3' },
                        owner: { type: 'string', nullable: true, example: 'IT Lead' },
                        status: { type: 'string', enum: ['todo', 'inprogress', 'done'], default: 'todo' },
                        positionX: { type: 'number', nullable: true },
                        positionY: { type: 'number', nullable: true },
                        xValue: { type: 'integer', nullable: true, description: 'X-axis value for matrix sections' },
                        yValue: { type: 'integer', nullable: true, description: 'Y-axis value for matrix sections' },
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
                        eventType: { type: 'string', example: 'board.updated' },
                        elementId: { type: 'string', format: 'uuid', nullable: true },
                        elementType: { type: 'string', nullable: true },
                        details: { type: 'object', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string', nullable: true },
                        avatarUrl: { type: 'string', nullable: true },
                        subscriptionTier: { type: 'string', enum: ['student', 'commercial', 'enterprise'] },
                        subscriptionStatus: { type: 'string', enum: ['active', 'expired', 'cancelled'] },
                        emailVerified: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },

                // ─── Project plan import (voice-2-bpmn) ──────────────────────────
                Track: {
                    type: 'object',
                    description: 'A swim-lane track in a project plan.',
                    required: ['id', 'name'],
                    properties: {
                        id: { type: 'string', example: 'track_1' },
                        name: { type: 'string', example: 'Technology' },
                    },
                },
                PlanTask: {
                    type: 'object',
                    description: 'A single deliverable task within a project plan.',
                    required: ['id', 'title', 'track_id', 'week_start', 'week_end'],
                    properties: {
                        id: { type: 'string', example: 'task_1' },
                        title: { type: 'string', example: 'Automate PO matching' },
                        track_id: { type: 'string', example: 'track_1', description: 'References a Track.id in the same plan' },
                        week_start: { type: 'integer', minimum: 1, example: 1 },
                        week_end: { type: 'integer', minimum: 1, example: 3 },
                        owner: { type: 'string', nullable: true, example: 'IT Lead' },
                        improvement_id: { type: 'string', nullable: true, description: 'Reference to the originating improvement suggestion' },
                    },
                },
                PlanRisk: {
                    type: 'object',
                    description: 'A risk associated with a project plan task.',
                    properties: {
                        id: { type: 'string', example: 'risk_1' },
                        title: { type: 'string', example: 'Integration delays' },
                        description: { type: 'string' },
                        probability: { type: 'integer', minimum: 0, maximum: 100, example: 60 },
                        consequence: { type: 'integer', minimum: 0, maximum: 100, example: 80 },
                        mitigation: { type: 'string' },
                        task_id: { type: 'string', example: 'task_1' },
                    },
                },
                ProjectPlanImportRequest: {
                    type: 'object',
                    description: 'Payload sent by voice-2-bpmn to create a board from a generated project plan.',
                    required: ['tracks', 'tasks'],
                    properties: {
                        plan_name: { type: 'string', example: 'Invoice Approval Improvement Plan', description: 'Used as the board title. Falls back to process_name.' },
                        process_name: { type: 'string', example: 'Invoice Approval Process', description: 'Fallback board title if plan_name is absent.' },
                        duration_weeks: { type: 'integer', minimum: 4, maximum: 14, default: 8, example: 10 },
                        tracks: { type: 'array', items: { $ref: '#/components/schemas/Track' }, minItems: 1 },
                        tasks: { type: 'array', items: { $ref: '#/components/schemas/PlanTask' } },
                        risks: { type: 'array', items: { $ref: '#/components/schemas/PlanRisk' }, description: 'Stored for reference; not currently persisted as separate DB records.' },
                    },
                },
                ProjectPlanImportResult: {
                    type: 'object',
                    description: 'Result returned after a successful plan import.',
                    properties: {
                        message: { type: 'string', example: 'Project plan imported successfully' },
                        boardId: { type: 'string', format: 'uuid' },
                        boardUrl: { type: 'string', example: 'http://localhost:5173/board.html?id=<uuid>', description: 'Direct link to open the board in the vimpl frontend' },
                        sectionId: { type: 'string', format: 'uuid', description: 'ID of the created weekplan section' },
                        tasksCreated: { type: 'integer', example: 6, description: 'Number of post-it tasks created' },
                    },
                },

                // ─── Subscription ─────────────────────────────────────────────────
                SubscriptionTier: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', enum: ['student', 'commercial', 'enterprise'] },
                        name: { type: 'string' },
                        price: { type: 'number', nullable: true },
                        boardLimit: { type: 'integer', nullable: true, description: 'null = unlimited' },
                        features: { type: 'array', items: { type: 'string' } },
                    },
                },

                // ─── Admin ────────────────────────────────────────────────────────
                LoginAudit: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid', nullable: true },
                        email: { type: 'string', format: 'email' },
                        loginMethod: { type: 'string', enum: ['email', 'google'] },
                        success: { type: 'boolean' },
                        ipAddress: { type: 'string', nullable: true },
                        userAgent: { type: 'string', nullable: true },
                        errorMessage: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },

                // ─── Generic ──────────────────────────────────────────────────────
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Validation Error' },
                        message: { type: 'string', example: 'Title is required' },
                    },
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: {} },
                        total: { type: 'integer' },
                        hasMore: { type: 'boolean' },
                        offset: { type: 'integer' },
                        limit: { type: 'integer' },
                    },
                },
            },
            responses: {
                Unauthorized: {
                    description: 'Authentication required — missing or invalid JWT',
                    content: {
                        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                    },
                },
                Forbidden: {
                    description: 'Access denied — authenticated but insufficient permission',
                    content: {
                        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                    },
                },
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                    },
                },
                BadRequest: {
                    description: 'Invalid request data',
                    content: {
                        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentication, registration, and token management' },
            { name: 'Boards', description: 'Board CRUD operations and the voice-2-bpmn import endpoint' },
            { name: 'Sections', description: 'Board section management' },
            { name: 'Post-its', description: 'Post-it note management' },
            { name: 'Subscription', description: 'Subscription tier info and upgrades' },
            { name: 'Portfolio', description: 'Cross-board analytics and activity feed' },
            { name: 'Event Log', description: 'Board activity history' },
            { name: 'Admin', description: 'Login audit and user administration' },
            { name: 'Leads', description: 'Contact / interest form submissions' },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
