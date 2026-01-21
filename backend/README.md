# vimpl Backend API

Backend API for vimpl SaaS visual planning board application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 15+ (or Supabase account)
- npm or yarn

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vimpl"

# JWT Secrets (generate new ones for production!)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/google/callback"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### 3. Set Up Database

#### Option A: Local PostgreSQL

```bash
# Create database
createdb vimpl

# Run migrations
npm run db:push

# (Optional) Seed with test data
npm run db:seed
```

#### Option B: Supabase (Recommended)

1. Create a new project on [Supabase](https://supabase.com)
2. Get your connection string from Settings → Database
3. Update `DATABASE_URL` in `.env`
4. Run migrations:

```bash
npm run db:push
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # Prisma client
│   │   ├── index.ts          # Configuration
│   │   └── passport.ts       # Passport strategies
│   ├── controllers/
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   └── board.controller.ts  # Board endpoints
│   ├── middleware/
│   │   └── auth.middleware.ts   # JWT authentication
│   ├── routes/
│   │   ├── auth.routes.ts       # Auth routes
│   │   └── board.routes.ts      # Board routes
│   ├── services/
│   │   ├── auth.service.ts      # Auth business logic
│   │   └── board.service.ts     # Board business logic
│   ├── utils/
│   │   └── logger.ts            # Winston logger
│   └── server.ts                # Express app
├── prisma/
│   └── schema.prisma         # Database schema
├── .env.example              # Environment template
├── package.json
└── tsconfig.json
```

---

## 🔐 Authentication

### Email/Password Registration

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "jwt-token"
}
```

### Email/Password Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Google OAuth

```bash
# Initiate Google login
GET /api/v1/auth/google

# Callback (handled automatically)
GET /api/v1/auth/google/callback
```

### Get Current User

```bash
GET /api/v1/auth/me
Authorization: Bearer {accessToken}
```

### Refresh Token

```bash
POST /api/v1/auth/refresh
Cookie: refreshToken=...
# or
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}
```

---

## 📋 API Endpoints

### Boards

#### List User's Boards
```bash
GET /api/v1/boards
Authorization: Bearer {accessToken}
```

#### Get Board by ID
```bash
GET /api/v1/boards/:id
Authorization: Bearer {accessToken}
```

#### Get Board by Slug
```bash
GET /api/v1/boards/slug/:slug
Authorization: Bearer {accessToken}  # Optional for public boards
```

#### Create Board
```bash
POST /api/v1/boards
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "My Project Board",
  "description": "Project planning board"
}
```

#### Update Board
```bash
PUT /api/v1/boards/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Updated Title",
  "gridData": {...},
  "settings": {...}
}
```

#### Delete Board
```bash
DELETE /api/v1/boards/:id
Authorization: Bearer {accessToken}
```

### Sections

#### Create Section
```bash
POST /api/v1/boards/:boardId/sections
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "type": "matrix",
  "title": "Risk Matrix",
  "positionX": 0,
  "positionY": 0,
  "width": 6,
  "height": 4,
  "content": {}
}
```

#### Update Section
```bash
PUT /api/v1/boards/:boardId/sections/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Updated Title",
  "isLocked": true
}
```

#### Delete Section
```bash
DELETE /api/v1/boards/:boardId/sections/:id
Authorization: Bearer {accessToken}
```

### Post-its

#### Create Post-it
```bash
POST /api/v1/boards/:boardId/postits
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "sectionId": "section-uuid",
  "color": "yellow",
  "content": "Task description",
  "owner": "john@example.com",
  "status": "todo",
  "positionX": 100,
  "positionY": 200
}
```

#### Update Post-it
```bash
PUT /api/v1/boards/:boardId/postits/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "content": "Updated content",
  "status": "done"
}
```

#### Delete Post-it
```bash
DELETE /api/v1/boards/:boardId/postits/:id
Authorization: Bearer {accessToken}
```

---

## 🗄️ Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Open Prisma Studio (visual database editor)
npm run db:studio

# Seed database (optional)
npm run db:seed
```

### Database Schema

See `prisma/schema.prisma` for the complete schema.

Main tables:
- **users** - User accounts
- **boards** - User boards
- **sections** - Board sections
- **postits** - Post-it notes
- **team_members** - Team member references
- **board_collaborators** - Board sharing
- **event_logs** - Activity logs
- **sessions** - User sessions

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## 📦 Deployment

### Railway (Recommended)

1. Create a new project on [Railway](https://railway.app)

2. Add PostgreSQL database:
   - New → Database → PostgreSQL

3. Add your backend service:
   - New → GitHub Repo → Select your repo

4. Configure environment variables in Railway dashboard

5. Deploy:
   ```bash
   git push origin main
   ```

Railway will automatically:
- Install dependencies
- Run build
- Start the server

### Render

1. Create a new Web Service on [Render](https://render.com)

2. Connect your GitHub repository

3. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. Add environment variables

5. Add PostgreSQL database (or use Supabase)

### Manual Deployment

```bash
# Build
npm run build

# Start production server
NODE_ENV=production npm start
```

---

## 🔒 Security Checklist

- [ ] Change JWT secrets in production
- [ ] Use strong database password
- [ ] Enable HTTPS (handled by hosting platforms)
- [ ] Set secure CORS origins
- [ ] Enable rate limiting (configured)
- [ ] Review and update security headers
- [ ] Set up monitoring and logging
- [ ] Enable database backups
- [ ] Implement proper error handling
- [ ] Add input validation (Zod/Joi)

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Check Prisma connection
npx prisma db pull
```

### Port Already in Use

```bash
# Change port in .env
PORT=3002

# Or kill process on port 3001
lsof -ti:3001 | xargs kill
```

### Prisma Issues

```bash
# Reset Prisma Client
rm -rf node_modules/.prisma
npm run db:generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js](https://expressjs.com/)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/)

---

## 🤝 Contributing

See main project [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 📝 License

MIT License - see [LICENSE](../LICENSE)
