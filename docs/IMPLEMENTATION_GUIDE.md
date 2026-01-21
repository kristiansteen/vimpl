# vimpl SaaS v1.0 - Implementation Guide

**From PoC to Production SaaS**  
**Created**: 7 January 2025  
**Status**: Ready for Implementation

---

## 🎯 What You Have

I've transformed your vimpl PoC into a production-ready SaaS application with:

✅ **Complete backend API** with Node.js + Express + TypeScript  
✅ **PostgreSQL database** with Prisma ORM  
✅ **User authentication** (Email/Password + Google SSO)  
✅ **Multi-tenant architecture** with proper data isolation  
✅ **RESTful API** with all CRUD operations  
✅ **Security best practices** (JWT, bcrypt, rate limiting, CORS)  
✅ **Production-ready code** with error handling and logging  

---

## 📦 Project Structure

```
vimpl-saas/
├── backend/                  # NEW - Complete backend API
│   ├── src/
│   │   ├── config/          # Configuration & database
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   └── server.ts        # Express app
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
└── frontend/                 # TO DO - Update existing frontend
    └── (Your existing vimpl files + API integration)
```

---

## 🚀 Quick Start (Development)

### 1. Backend Setup (15 minutes)

```bash
# Navigate to backend
cd vimpl-saas/backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Set up database (Supabase recommended)
npm run db:push
npm run db:generate

# Start development server
npm run dev
```

Backend will run on `http://localhost:3001`

### 2. Database Setup

**Option A: Supabase (Recommended - Free tier available)**

1. Go to [https://supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Add to `.env`:
   ```
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   ```

**Option B: Local PostgreSQL**

```bash
createdb vimpl
# Update .env with: DATABASE_URL="postgresql://user:pass@localhost:5432/vimpl"
```

### 3. Test Backend

```bash
# Health check
curl http://localhost:3001/health

# Register a user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

---

## 🔧 Configuration

### Required Environment Variables

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://..."

# JWT Secrets (REQUIRED - generate unique values)
JWT_SECRET="your-unique-secret-min-32-chars"
JWT_REFRESH_SECRET="your-unique-refresh-secret-min-32-chars"

# Server
PORT=3001
NODE_ENV=development

# Frontend (update when deploying)
FRONTEND_URL="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### Generating Secure Secrets

```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   ```
   http://localhost:3001/api/v1/auth/google/callback
   ```
6. Add credentials to `.env`:
   ```env
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

---

## 📊 Database Schema

The database includes these main tables:

- **users** - User accounts with email/password or OAuth
- **boards** - User boards with settings and grid data
- **sections** - Board sections (matrix, week plan, etc.)
- **postits** - Post-it notes with content and metadata
- **team_members** - Team member references
- **board_collaborators** - Board sharing and permissions
- **event_logs** - Activity tracking
- **sessions** - User sessions

See `backend/prisma/schema.prisma` for complete schema.

---

## 🔐 Authentication Flow

### Registration

```
User submits email + password
  ↓
Backend validates and hashes password
  ↓
User created in database
  ↓
JWT tokens generated
  ↓
Access token sent to frontend
Refresh token set as httpOnly cookie
```

### Login

```
User submits credentials
  ↓
Backend verifies password
  ↓
JWT tokens generated
  ↓
Frontend stores access token
Backend sets refresh token cookie
```

### Google OAuth

```
User clicks "Sign in with Google"
  ↓
Redirects to Google consent screen
  ↓
Google redirects back with code
  ↓
Backend exchanges code for user info
  ↓
User created/updated in database
  ↓
JWT tokens generated
  ↓
Redirects to frontend with token
```

---

## 📋 API Endpoints Summary

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - Google callback

### Boards
- `GET /api/v1/boards` - List user's boards
- `POST /api/v1/boards` - Create board
- `GET /api/v1/boards/:id` - Get board
- `PUT /api/v1/boards/:id` - Update board
- `DELETE /api/v1/boards/:id` - Delete board

### Sections
- `POST /api/v1/boards/:boardId/sections` - Create section
- `PUT /api/v1/boards/:boardId/sections/:id` - Update section
- `DELETE /api/v1/boards/:boardId/sections/:id` - Delete section

### Post-its
- `POST /api/v1/boards/:boardId/postits` - Create post-it
- `PUT /api/v1/boards/:boardId/postits/:id` - Update post-it
- `DELETE /api/v1/boards/:boardId/postits/:id` - Delete post-it

See `backend/README.md` for detailed API documentation.

---

## 🎨 Frontend Integration (Next Steps)

### What Needs to Change

1. **Replace localStorage with API calls**
   - Board creation/loading
   - Section CRUD operations
   - Post-it CRUD operations
   - Auto-save to API instead of localStorage

2. **Add authentication UI**
   - Login page
   - Registration page
   - Google OAuth button
   - Dashboard (list of boards)
   - Protected routes

3. **Add API client**
   - Axios or Fetch wrapper
   - JWT token management
   - Request/response interceptors
   - Error handling

### Example API Integration

```javascript
// api/client.js
const API_URL = 'http://localhost:3001/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('accessToken');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        await this.refreshToken();
        // Retry request
        return this.request(endpoint, options);
      }
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async refreshToken() {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      this.token = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);
    } else {
      // Refresh failed, redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
  }

  // Auth methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = data.accessToken;
    localStorage.setItem('accessToken', data.accessToken);
    return data.user;
  }

  async register(email, password, name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.token = data.accessToken;
    localStorage.setItem('accessToken', data.accessToken);
    return data.user;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Board methods
  async getBoards() {
    return this.request('/boards');
  }

  async createBoard(title, description) {
    return this.request('/boards', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  async getBoard(id) {
    return this.request(`/boards/${id}`);
  }

  async updateBoard(id, data) {
    return this.request(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBoard(id) {
    return this.request(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  // Section methods
  async createSection(boardId, sectionData) {
    return this.request(`/boards/${boardId}/sections`, {
      method: 'POST',
      body: JSON.stringify(sectionData),
    });
  }

  // Post-it methods
  async createPostit(boardId, postitData) {
    return this.request(`/boards/${boardId}/postits`, {
      method: 'POST',
      body: JSON.stringify(postitData),
    });
  }

  async updatePostit(boardId, postitId, data) {
    return this.request(`/boards/${boardId}/postits/${postitId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export default new ApiClient();
```

---

## 🚀 Deployment

### Backend Deployment (Railway - Recommended)

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Create new project**:
   - New Project → Deploy from GitHub repo

3. **Add PostgreSQL**:
   - New → Database → PostgreSQL
   - Railway will provide DATABASE_URL automatically

4. **Configure environment variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   FRONTEND_URL=https://your-frontend.com
   ALLOWED_ORIGINS=https://your-frontend.com
   ```

5. **Deploy**:
   ```bash
   git push origin main
   ```

**Cost**: Free tier → $5/month hobby plan for production

### Frontend Deployment

1. **Vercel** (recommended for static sites)
2. **Netlify**
3. **Cloudflare Pages**

Update frontend environment variables:
```
VITE_API_URL=https://your-backend.railway.app/api/v1
```

---

## 💰 Cost Breakdown

### Free Tier (MVP)
- **Railway**: Free for first month
- **Supabase**: Free (500MB database)
- **Vercel**: Free
- **Total**: £0/month for testing

### Production (100-1000 users)
- **Railway**: £5/month (Hobby plan)
- **Supabase**: £20/month (Pro plan)
- **Vercel**: £0/month (free tier sufficient)
- **Total**: ~£25/month (~$30)

### Scale (1000+ users)
- **Railway**: £20-50/month
- **Supabase**: £50-100/month
- **Total**: ~£70-150/month

---

## ✅ Implementation Checklist

### Phase 1: Backend Setup (Week 1-2)
- [ ] Set up development environment
- [ ] Configure database (Supabase)
- [ ] Run migrations
- [ ] Test all API endpoints with Postman/Insomnia
- [ ] Set up Google OAuth (optional)
- [ ] Deploy backend to Railway
- [ ] Test production API

### Phase 2: Frontend Integration (Week 3-4)
- [ ] Create API client wrapper
- [ ] Build login/registration pages
- [ ] Add dashboard page (list boards)
- [ ] Update board.js to use API
- [ ] Replace localStorage calls with API calls
- [ ] Add loading states and error handling
- [ ] Test authentication flow
- [ ] Test board CRUD operations

### Phase 3: Polish & Launch (Week 5-6)
- [ ] Add user onboarding
- [ ] Implement proper error messages
- [ ] Add loading indicators
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Deploy frontend
- [ ] End-to-end testing
- [ ] Soft launch to beta users

---

## 🐛 Common Issues & Solutions

### Database Connection Errors

**Problem**: Cannot connect to database  
**Solution**:
```bash
# Test connection
psql $DATABASE_URL

# Check Prisma
npx prisma db pull

# Regenerate client
npm run db:generate
```

### CORS Errors

**Problem**: Frontend can't connect to backend  
**Solution**: Update `ALLOWED_ORIGINS` in backend `.env`:
```env
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000,https://your-frontend.com"
```

### JWT Token Errors

**Problem**: "Invalid token" errors  
**Solution**:
- Check token expiry (default 15 minutes)
- Implement refresh token flow
- Clear localStorage and login again

### Port Already in Use

**Problem**: Backend won't start  
**Solution**:
```bash
# Change port or kill process
lsof -ti:3001 | xargs kill
```

---

## 📚 Additional Resources

- [Backend README](backend/README.md) - Detailed API documentation
- [Prisma Documentation](https://www.prisma.io/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🤔 Next Steps After v1.0

Once the SaaS v1.0 is live, consider:

1. **Real-time collaboration** (Socket.IO or Supabase Realtime)
2. **Board templates** library
3. **File attachments** to post-its
4. **Export to PDF/PNG**
5. **Team workspaces**
6. **Activity feeds**
7. **Notifications**
8. **Mobile app** (React Native)

---

## 💡 Key Differences from PoC

| Feature | PoC | SaaS v1.0 |
|---------|-----|-----------|
| Data Storage | localStorage | PostgreSQL |
| Authentication | None | Email/Password + Google SSO |
| User Accounts | No | Yes |
| Multiple Boards | No | Yes (unlimited) |
| Collaboration | No | Board sharing (ready) |
| Data Persistence | Browser only | Cloud (accessible anywhere) |
| Scalability | Limited | Production-ready |
| Security | Basic | Production-grade |

---

## 🎯 Success Metrics

Track these KPIs after launch:

- **User Registration Rate**
- **Daily/Weekly Active Users**
- **Boards Created per User**
- **User Retention Rate**
- **API Response Times** (target: <200ms)
- **Error Rates** (target: <1%)

---

**Questions? Need help with implementation?**

The backend is complete and ready to use. Frontend integration is the main remaining task - I can help you with that next!

Good luck with your SaaS launch! 🚀
