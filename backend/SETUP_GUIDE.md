# Backend Setup Guide - Step by Step

Follow these instructions to get your vimpl backend running.

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Node.js 18+** installed ([download here](https://nodejs.org/))
  ```bash
  node -v  # Should show v18.x.x or higher
  ```

- [ ] **npm** installed (comes with Node.js)
  ```bash
  npm -v
  ```

- [ ] **Git** installed ([download here](https://git-scm.com/))
  ```bash
  git --version
  ```

- [ ] A **code editor** (VS Code recommended)

---

## Option A: Automated Setup (Recommended)

Run the setup script I've created for you:

```bash
# Navigate to backend directory
cd vimpl-saas/backend

# Make script executable (Mac/Linux)
chmod +x setup.sh

# Run setup script
bash setup.sh
```

The script will:
1. ✅ Check Node.js version
2. ✅ Install all dependencies
3. ✅ Create .env file
4. ✅ Generate secure JWT secrets
5. ✅ Set up the database
6. ✅ Run Prisma migrations

**Then continue to "Start the Server" section below.**

---

## Option B: Manual Setup (If script doesn't work)

### Step 1: Navigate to Backend Directory

```bash
cd vimpl-saas/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Express, Prisma, Passport
- TypeScript and all type definitions
- Security packages (bcrypt, JWT, helmet)
- All other dependencies (~50 packages)

**Expected output:** Should complete without errors in 1-2 minutes.

---

### Step 3: Set Up Database (Supabase - Recommended)

#### 3.1 Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (easiest)

#### 3.2 Create New Project

1. Click "New Project"
2. Fill in details:
   - **Name**: `vimpl-backend`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you (e.g., West EU, US East)
   - **Pricing Plan**: Free (perfect for development)
3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

#### 3.3 Get Connection String

1. Once project is ready, go to **Project Settings** (gear icon)
2. Click **Database** in left sidebar
3. Scroll down to **Connection string**
4. Select **URI** tab
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you set earlier

#### 3.4 Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your editor

3. Update `DATABASE_URL` with your Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres"
   ```

4. Generate secure JWT secrets:
   ```bash
   # Generate JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate JWT_REFRESH_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Update the secrets in `.env`:
   ```env
   JWT_SECRET="paste-first-generated-secret-here"
   JWT_REFRESH_SECRET="paste-second-generated-secret-here"
   ```

Your `.env` should now look like:
```env
DATABASE_URL="postgresql://postgres:pass123@db.xxxxx.supabase.co:5432/postgres"

PORT=3001
NODE_ENV=development

JWT_SECRET="a1b2c3d4e5f6...32-char-hex"
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET="f6e5d4c3b2a1...32-char-hex"
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
```

---

### Step 4: Set Up Database Schema

#### 4.1 Generate Prisma Client

```bash
npm run db:generate
```

**Expected output:**
```
✔ Generated Prisma Client
```

#### 4.2 Push Schema to Database

```bash
npm run db:push
```

**Expected output:**
```
🚀  Your database is now in sync with your Prisma schema.
```

This creates all the tables in your Supabase database:
- users
- boards
- sections
- postits
- team_members
- board_collaborators
- event_logs
- sessions

#### 4.3 Verify Database Setup (Optional)

Open Prisma Studio to see your database:
```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can see all your tables.

---

## Start the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

**Expected output:**
```
🚀 Server running on port 3001 in development mode
📍 API available at http://localhost:3001/api/v1
💚 Health check at http://localhost:3001/health
```

The server will automatically restart when you make code changes.

### Production Mode

```bash
npm run build
npm start
```

---

## Verify Everything Works

### Test 1: Health Check

Open your browser or use curl:

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-07T...",
  "uptime": 5.123,
  "environment": "development"
}
```

### Test 2: Register a User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "name": "Test User"
  }'
```

**Expected response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "emailVerified": false,
    "createdAt": "2025-01-07T..."
  },
  "accessToken": "eyJhbGc..."
}
```

### Test 3: Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**Expected response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "accessToken": "eyJhbGc..."
}
```

### Test 4: Create a Board

First, copy the `accessToken` from the login response, then:

```bash
curl -X POST http://localhost:3001/api/v1/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "title": "My First Board",
    "description": "Testing the API"
  }'
```

**Expected response:**
```json
{
  "message": "Board created successfully",
  "board": {
    "id": "uuid-here",
    "title": "My First Board",
    "slug": "my-first-board",
    "userId": "user-uuid",
    "createdAt": "2025-01-07T..."
  }
}
```

---

## Troubleshooting

### Problem: "Cannot connect to database"

**Solution:**
1. Check your DATABASE_URL in `.env`
2. Verify Supabase project is running
3. Test connection with psql:
   ```bash
   psql "$DATABASE_URL"
   ```

### Problem: "Port 3001 is already in use"

**Solution:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill

# Or change port in .env
PORT=3002
```

### Problem: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Problem: "Prisma Client not generated"

**Solution:**
```bash
# Regenerate Prisma Client
npm run db:generate
```

### Problem: Database migration errors

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or push schema again
npm run db:push
```

---

## What's Running?

When the server is running, you have:

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `POST /api/v1/auth/register` | Register new user |
| `POST /api/v1/auth/login` | Login |
| `GET /api/v1/auth/me` | Get current user |
| `GET /api/v1/boards` | List boards |
| `POST /api/v1/boards` | Create board |
| And 15+ more endpoints... | See backend/README.md |

---

## Next Steps

Once your backend is running:

1. ✅ **Test all endpoints** using the test script:
   ```bash
   bash test-api.sh
   ```

2. ✅ **Check Prisma Studio** to see your data:
   ```bash
   npm run db:studio
   ```

3. ✅ **Review the logs** - the server logs all requests

4. ✅ **Optional: Set up Google OAuth**
   - Follow instructions in backend/README.md
   - Get credentials from Google Cloud Console

5. ✅ **Start working on frontend integration**
   - I can help you build the API client
   - Create login/registration pages
   - Connect the existing board.js to the API

---

## Quick Reference Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Run tests
npm test

# Check for errors
npm run lint
```

---

## Need Help?

If you get stuck:

1. Check the terminal output for error messages
2. Verify your .env file is configured correctly
3. Make sure Supabase project is running
4. Try the troubleshooting section above
5. Check backend/README.md for more details

---

**Ready?** Run `npm run dev` and let's test your API! 🚀
