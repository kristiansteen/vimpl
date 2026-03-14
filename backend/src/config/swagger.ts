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
                url: 'https://backend-eight-rho-46.vercel.app/api/v1',
                description: 'Production',
            },
            {
                url: '/api/v1',
                description: 'Local development',
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
                        },
                        content: { type: 'string', nullable: true, example: 'Automate PO matching\nWk 1–3' },
                        owner: { type: 'string', nullable: true, example: 'IT Lead' },
                        status: { type: 'string', enum: ['todo', 'inprogress', 'done'], default: 'todo' },
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
                    required: ['id', 'name'],
                    properties: {
                        id: { type: 'string', example: 'track_1' },
                        name: { type: 'string', example: 'Technology' },
                    },
                },
                PlanTask: {
                    type: 'object',
                    required: ['id', 'title', 'track_id', 'week_start', 'week_end'],
                    properties: {
                        id: { type: 'string', example: 'task_1' },
                        title: { type: 'string', example: 'Automate PO matching' },
                        track_id: { type: 'string', example: 'track_1' },
                        week_start: { type: 'integer', minimum: 1, example: 1 },
                        week_end: { type: 'integer', minimum: 1, example: 3 },
                        owner: { type: 'string', nullable: true, example: 'IT Lead' },
                        improvement_id: { type: 'string', nullable: true },
                    },
                },
                PlanRisk: {
                    type: 'object',
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
                    required: ['tracks', 'tasks'],
                    properties: {
                        plan_name: { type: 'string', example: 'Invoice Approval Improvement Plan' },
                        process_name: { type: 'string', example: 'Invoice Approval Process' },
                        duration_weeks: { type: 'integer', minimum: 4, maximum: 14, default: 8, example: 10 },
                        tracks: { type: 'array', items: { $ref: '#/components/schemas/Track' }, minItems: 1 },
                        tasks: { type: 'array', items: { $ref: '#/components/schemas/PlanTask' } },
                        risks: { type: 'array', items: { $ref: '#/components/schemas/PlanRisk' } },
                    },
                },
                ProjectPlanImportResult: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Project plan imported successfully' },
                        boardId: { type: 'string', format: 'uuid' },
                        boardUrl: { type: 'string', example: 'https://frontend-puce-ten-18.vercel.app/board.html?id=<uuid>' },
                        sectionId: { type: 'string', format: 'uuid' },
                        tasksCreated: { type: 'integer', example: 6 },
                    },
                },
                SubscriptionTier: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', enum: ['student', 'commercial', 'enterprise'] },
                        name: { type: 'string' },
                        price: { type: 'number', nullable: true },
                        boardLimit: { type: 'integer', nullable: true },
                        features: { type: 'array', items: { type: 'string' } },
                    },
                },
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
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
                Forbidden: {
                    description: 'Access denied — authenticated but insufficient permission',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
                NotFound: {
                    description: 'Resource not found',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
                BadRequest: {
                    description: 'Invalid request data',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
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
            { name: 'Diagrams', description: 'BPMN diagram storage' },
        ],
        // ─── All paths defined inline (required for Vercel serverless bundling) ──
        paths: {
            // ── Auth ──────────────────────────────────────────────────────────────
            '/auth/register': {
                post: {
                    summary: 'Register a new user',
                    tags: ['Auth'],
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string', minLength: 8 },
                                        name: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'User registered. Returns accessToken.' },
                        400: { $ref: '#/components/responses/BadRequest' },
                        409: { description: 'Email already in use' },
                    },
                },
            },
            '/auth/login': {
                post: {
                    summary: 'Log in with email and password',
                    tags: ['Auth'],
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Login successful. Returns accessToken.',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            accessToken: { type: 'string' },
                                            user: { $ref: '#/components/schemas/User' },
                                        },
                                    },
                                },
                            },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/auth/logout': {
                post: {
                    summary: 'Log out the current user',
                    tags: ['Auth'],
                    responses: { 200: { description: 'Logged out successfully' } },
                },
            },
            '/auth/refresh': {
                post: {
                    summary: 'Refresh the access token using the refresh token cookie',
                    tags: ['Auth'],
                    responses: {
                        200: {
                            description: 'New access token issued',
                            content: {
                                'application/json': {
                                    schema: { type: 'object', properties: { accessToken: { type: 'string' } } },
                                },
                            },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/auth/verify-email': {
                post: {
                    summary: 'Verify email address using a token',
                    tags: ['Auth'],
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Email verified successfully' },
                        400: { description: 'Invalid or expired token' },
                    },
                },
            },
            '/auth/me': {
                get: {
                    summary: 'Get the currently authenticated user',
                    tags: ['Auth'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Current user data',
                            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/auth/google': {
                get: {
                    summary: 'Initiate Google OAuth login',
                    tags: ['Auth'],
                    security: [],
                    responses: { 302: { description: 'Redirects to Google OAuth consent screen' } },
                },
            },

            // ── Boards ────────────────────────────────────────────────────────────
            '/boards': {
                get: {
                    summary: 'Get all boards for the authenticated user',
                    tags: ['Boards'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of boards',
                            content: {
                                'application/json': {
                                    schema: { type: 'array', items: { $ref: '#/components/schemas/Board' } },
                                },
                            },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
                post: {
                    summary: 'Create a new board',
                    tags: ['Boards'],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['title'],
                                    properties: {
                                        title: { type: 'string' },
                                        description: { type: 'string' },
                                        isPublic: { type: 'boolean' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Board created',
                            content: { 'application/json': { schema: { $ref: '#/components/schemas/Board' } } },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/boards/import': {
                post: {
                    summary: 'Import a project plan — creates board, weekplan section, and all tasks atomically',
                    description: 'Accepts a ProjectPlan object produced by voice-2-bpmn and creates a board, weekplan section, and post-it tasks in a single transaction.',
                    tags: ['Boards'],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ProjectPlanImportRequest' },
                                example: {
                                    plan_name: 'Invoice Approval Improvement Plan',
                                    process_name: 'Invoice Approval Process',
                                    duration_weeks: 10,
                                    tracks: [{ id: 'track_1', name: 'Technology' }, { id: 'track_2', name: 'Process' }],
                                    tasks: [
                                        { id: 'task_1', title: 'Automate PO matching', track_id: 'track_1', week_start: 1, week_end: 3, owner: 'IT Lead' },
                                        { id: 'task_2', title: 'Update approval policy', track_id: 'track_2', week_start: 2, week_end: 4, owner: 'Finance Manager' },
                                    ],
                                    risks: [{ id: 'risk_1', title: 'Integration delays', probability: 60, consequence: 80 }],
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Project plan imported',
                            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectPlanImportResult' } } },
                        },
                        400: { $ref: '#/components/responses/BadRequest' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/boards/slug/{slug}': {
                get: {
                    summary: 'Get a board by its slug',
                    tags: ['Boards'],
                    parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'Board data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Board' } } } },
                        404: { $ref: '#/components/responses/NotFound' },
                    },
                },
            },
            '/boards/{id}': {
                get: {
                    summary: 'Get a board by ID',
                    tags: ['Boards'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
                    responses: {
                        200: { description: 'Board data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Board' } } } },
                        403: { $ref: '#/components/responses/Forbidden' },
                        404: { $ref: '#/components/responses/NotFound' },
                    },
                },
                put: {
                    summary: 'Update a board',
                    tags: ['Boards'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        title: { type: 'string' },
                                        description: { type: 'string' },
                                        gridData: { type: 'object' },
                                        settings: { type: 'object' },
                                        isPublic: { type: 'boolean' },
                                        version: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Board updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Board' } } } },
                        409: { description: 'Version conflict (optimistic locking)' },
                    },
                },
                delete: {
                    summary: 'Delete a board',
                    tags: ['Boards'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
                    responses: {
                        204: { description: 'Board deleted' },
                        403: { $ref: '#/components/responses/Forbidden' },
                        404: { $ref: '#/components/responses/NotFound' },
                    },
                },
            },
            '/boards/{id}/share': {
                post: {
                    summary: 'Share a board with another user',
                    tags: ['Boards'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'permission'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        permission: { type: 'string', enum: ['view', 'edit', 'admin'] },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Board shared successfully' },
                        404: { $ref: '#/components/responses/NotFound' },
                    },
                },
            },

            // ── Sections ─────────────────────────────────────────────────────────
            '/boards/{boardId}/sections': {
                post: {
                    summary: 'Create a section within a board',
                    tags: ['Sections'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'boardId', required: true, schema: { type: 'string', format: 'uuid' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['type'],
                                    properties: {
                                        type: { type: 'string', enum: ['text', 'matrix', 'weekplan', 'kpi', 'actions', 'postit-area', 'team'] },
                                        title: { type: 'string' },
                                        positionX: { type: 'integer' },
                                        positionY: { type: 'integer' },
                                        width: { type: 'integer' },
                                        height: { type: 'integer' },
                                        content: { type: 'object' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Section created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Section' } } } },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/boards/{boardId}/sections/{id}': {
                put: {
                    summary: 'Update a section',
                    tags: ['Sections'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: 'path', name: 'boardId', required: true, schema: { type: 'string', format: 'uuid' } },
                        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        title: { type: 'string' },
                                        positionX: { type: 'integer' },
                                        positionY: { type: 'integer' },
                                        width: { type: 'integer' },
                                        height: { type: 'integer' },
                                        content: { type: 'object' },
                                        isLocked: { type: 'boolean' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Section updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Section' } } } },
                    },
                },
                delete: {
                    summary: 'Delete a section',
                    tags: ['Sections'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: 'path', name: 'boardId', required: true, schema: { type: 'string', format: 'uuid' } },
                        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
                    ],
                    responses: { 204: { description: 'Section deleted' } },
                },
            },

            // ── Post-its ─────────────────────────────────────────────────────────
            '/boards/{boardId}/postits': {
                post: {
                    summary: 'Create a post-it note within a board section',
                    tags: ['Post-its'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'boardId', required: true, schema: { type: 'string', format: 'uuid' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['sectionId', 'color'],
                                    properties: {
                                        sectionId: { type: 'string', format: 'uuid' },
                                        color: { type: 'string', enum: ['yellow', 'pink', 'blue', 'green', 'orange'] },
                                        content: { type: 'string' },
                                        owner: { type: 'string' },
                                        status: { type: 'string', enum: ['todo', 'inprogress', 'done'] },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Post-it created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Postit' } } } },
                    },
                },
            },
            '/boards/{boardId}/postits/{id}': {
                put: {
                    summary: 'Update a post-it note',
                    tags: ['Post-its'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: 'path', name: 'boardId', required: true, schema: { type: 'string', format: 'uuid' } },
                        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        content: { type: 'string' },
                                        color: { type: 'string', enum: ['yellow', 'pink', 'blue', 'green', 'orange'] },
                                        owner: { type: 'string' },
                                        status: { type: 'string', enum: ['todo', 'inprogress', 'done'] },
                                        positionX: { type: 'number' },
                                        positionY: { type: 'number' },
                                        xValue: { type: 'integer' },
                                        yValue: { type: 'integer' },
                                        riskScore: { type: 'integer' },
                                        mitigation: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Post-it updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Postit' } } } },
                    },
                },
                delete: {
                    summary: 'Delete a post-it note',
                    tags: ['Post-its'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: 'path', name: 'boardId', required: true, schema: { type: 'string', format: 'uuid' } },
                        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
                    ],
                    responses: { 204: { description: 'Post-it deleted' } },
                },
            },

            // ── Event Log ────────────────────────────────────────────────────────
            '/boards/{boardId}/eventlog': {
                get: {
                    summary: 'Get the event log for a board',
                    tags: ['Event Log'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: 'path', name: 'boardId', required: true, schema: { type: 'string', format: 'uuid' } },
                        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
                        { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
                    ],
                    responses: {
                        200: {
                            description: 'List of events',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/EventLog' } } } },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },

            // ── Subscription ─────────────────────────────────────────────────────
            '/subscription/tiers': {
                get: {
                    summary: 'List all available subscription tiers',
                    tags: ['Subscription'],
                    security: [],
                    responses: {
                        200: {
                            description: 'Array of subscription tier definitions',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/SubscriptionTier' } } } },
                        },
                    },
                },
            },
            '/subscription/current': {
                get: {
                    summary: "Get the current user's subscription",
                    tags: ['Subscription'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Current subscription details',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            tier: { type: 'string', enum: ['student', 'commercial', 'enterprise'] },
                                            status: { type: 'string', enum: ['active', 'expired', 'cancelled'] },
                                            currentPeriodEnd: { type: 'string', format: 'date-time', nullable: true },
                                        },
                                    },
                                },
                            },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/subscription/can-create-board': {
                get: {
                    summary: 'Check whether the current user can create another board',
                    tags: ['Subscription'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Permission check result',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            allowed: { type: 'boolean' },
                                            reason: { type: 'string', nullable: true },
                                        },
                                    },
                                },
                            },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/subscription/upgrade': {
                post: {
                    summary: 'Upgrade to the Commercial tier',
                    tags: ['Subscription'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Subscription upgraded to Commercial' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/subscription/upgrade-enterprise': {
                post: {
                    summary: 'Upgrade to the Enterprise tier',
                    tags: ['Subscription'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Subscription upgraded to Enterprise' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/subscription/downgrade': {
                post: {
                    summary: 'Downgrade to the free Student tier',
                    tags: ['Subscription'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Subscription downgraded to Student' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },

            // ── Portfolio ────────────────────────────────────────────────────────
            '/portfolio/dashboard': {
                get: {
                    summary: 'Get the portfolio dashboard — all boards with stats',
                    tags: ['Portfolio'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Portfolio dashboard data' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/portfolio/comparison': {
                get: {
                    summary: 'Compare metrics across all boards',
                    tags: ['Portfolio'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Comparison metrics per board' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/portfolio/activity': {
                get: {
                    summary: "Recent activity across all the user's boards",
                    tags: ['Portfolio'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } }],
                    responses: {
                        200: {
                            description: 'Recent activity events',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/EventLog' } } } },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },

            // ── Admin ────────────────────────────────────────────────────────────
            '/admin/login-audits': {
                get: {
                    summary: 'Query login audit records with optional filters',
                    tags: ['Admin'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: 'query', name: 'userId', schema: { type: 'string', format: 'uuid' } },
                        { in: 'query', name: 'email', schema: { type: 'string', format: 'email' } },
                        { in: 'query', name: 'success', schema: { type: 'boolean' } },
                        { in: 'query', name: 'loginMethod', schema: { type: 'string', enum: ['email', 'google'] } },
                        { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' } },
                        { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' } },
                        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
                    ],
                    responses: {
                        200: {
                            description: 'Filtered login audit records',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LoginAudit' } } } },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/admin/login-audits/download': {
                get: {
                    summary: 'Download all login audit records as JSON',
                    tags: ['Admin'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Full login audit export',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LoginAudit' } } } },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/admin/login-audits/stats': {
                get: {
                    summary: 'Aggregate login statistics',
                    tags: ['Admin'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Login statistics' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/admin/users/{userId}/login-history': {
                get: {
                    summary: 'Get login history for a specific user',
                    tags: ['Admin'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'string', format: 'uuid' } }],
                    responses: {
                        200: {
                            description: 'Login history',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LoginAudit' } } } },
                        },
                        401: { $ref: '#/components/responses/Unauthorized' },
                        404: { $ref: '#/components/responses/NotFound' },
                    },
                },
            },
            '/admin/subscriptions': {
                get: {
                    summary: 'List all users with their subscription status',
                    tags: ['Admin'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'All user subscription records' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },

            // ── Leads ────────────────────────────────────────────────────────────
            '/leads': {
                post: {
                    summary: 'Submit a lead (contact/interest form)',
                    tags: ['Leads'],
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'email', 'selectedDocuments'],
                                    properties: {
                                        name: { type: 'string' },
                                        email: { type: 'string', format: 'email' },
                                        phone: { type: 'string' },
                                        selectedDocuments: { type: 'array', items: { type: 'string' } },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Lead submitted successfully' },
                        400: { $ref: '#/components/responses/BadRequest' },
                    },
                },
                get: {
                    summary: 'Get all leads (admin only)',
                    tags: ['Leads'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'List of leads' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },

            // ── Diagrams ─────────────────────────────────────────────────────────
            '/diagrams': {
                get: {
                    summary: "List the authenticated user's saved BPMN diagrams",
                    tags: ['Diagrams'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Array of diagram summaries' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
                post: {
                    summary: 'Save a new BPMN diagram',
                    tags: ['Diagrams'],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'xml'],
                                    properties: {
                                        name: { type: 'string' },
                                        xml: { type: 'string', description: 'Full BPMN 2.0 XML string' },
                                        processName: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Diagram saved' },
                        400: { $ref: '#/components/responses/BadRequest' },
                    },
                },
            },
            '/diagrams/{id}': {
                get: {
                    summary: 'Get a single diagram including its BPMN XML',
                    tags: ['Diagrams'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
                    responses: {
                        200: { description: 'Full diagram object including xml' },
                        404: { $ref: '#/components/responses/NotFound' },
                    },
                },
                put: {
                    summary: "Update an existing diagram's name or xml",
                    tags: ['Diagrams'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        xml: { type: 'string' },
                                        processName: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Diagram updated' },
                        404: { $ref: '#/components/responses/NotFound' },
                    },
                },
                delete: {
                    summary: 'Delete a diagram',
                    tags: ['Diagrams'],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
                    responses: {
                        204: { description: 'Deleted' },
                        404: { $ref: '#/components/responses/NotFound' },
                    },
                },
            },
        },
    },
    // No file scanning — all paths are defined inline above
    apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
