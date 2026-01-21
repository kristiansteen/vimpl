# vimpl SaaS v1.0 - Transformation Plan

**From**: PoC (localStorage-based)  
**To**: Multi-tenant SaaS product  
**Timeline**: 8-12 weeks  
**Budget**: £0-500/month (depending on scale)

---

## 🎯 Core Requirements

1. ✅ User authentication (Google SSO + email/password)
2. ✅ Individual boards per user
3. ✅ Secure data storage
4. ✅ Multi-tenant architecture
5. ✅ Board sharing capabilities
6. ✅ Scalable infrastructure

---

## 📊 Architecture Comparison

### Current PoC Architecture
```
Browser
  ↓
localStorage (local only)
  ↓
No backend, no persistence beyond browser
```

### Target SaaS Architecture
```
Browser Client
  ↓ HTTPS
API Gateway / Load Balancer
  ↓
Backend API (Node.js/Express)
  ↓
PostgreSQL Database
  ↓
Redis (sessions/caching)
```

---

## 🏗️ Recommended Technology Stack

### Backend (NEW)
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js or Fastify
- **Language**: TypeScript (for type safety)
- **ORM**: Prisma or TypeORM
- **Authentication**: Passport.js + JWT
- **Validation**: Zod or Joi

### Database (NEW)
- **Primary**: PostgreSQL 15+ (or Supabase)
- **Cache/Sessions**: Redis
- **File Storage**: AWS S3 or Cloudflare R2 (for future attachments)

### Frontend (MODIFIED)
- Keep existing HTML/CSS/JS
- Add authentication flow
- Add API integration layer
- Add user dashboard

### Infrastructure
- **Hosting**: Railway, Render, or Fly.io
- **Database**: Supabase, Neon, or Railway
- **Auth**: NextAuth.js or custom
- **CDN**: Cloudflare
- **Monitoring**: Sentry, LogRocket

---

## 📐 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for SSO users
    name VARCHAR(255),
    avatar_url TEXT,
    auth_provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'microsoft'
    auth_provider_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Boards table
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    grid_data JSONB NOT NULL DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_accessed_at TIMESTAMP DEFAULT NOW()
);

-- Sections table (normalized from board data)
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'text', 'matrix', 'weekplan', etc.
    title VARCHAR(255),
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER,
    height INTEGER,
    content JSONB DEFAULT '{}',
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Post-its table
CREATE TABLE postits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    color VARCHAR(20) NOT NULL,
    content TEXT,
    owner VARCHAR(255),
    status VARCHAR(20) DEFAULT 'todo', -- 'todo', 'inprogress', 'done'
    position_x FLOAT,
    position_y FLOAT,
    x_value INTEGER, -- for matrix
    y_value INTEGER, -- for matrix
    risk_score INTEGER, -- for matrix
    mitigation TEXT, -- for matrix
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Board collaborators (for sharing)
CREATE TABLE board_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'view', -- 'view', 'edit', 'admin'
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    UNIQUE(board_id, user_id)
);

-- Event log table
CREATE TABLE event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    element_id VARCHAR(100),
    element_type VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (for authentication)
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_boards_user_id ON boards(user_id);
CREATE INDEX idx_boards_slug ON boards(slug);
CREATE INDEX idx_sections_board_id ON sections(board_id);
CREATE INDEX idx_postits_board_id ON postits(board_id);
CREATE INDEX idx_postits_section_id ON postits(section_id);
CREATE INDEX idx_event_logs_board_id ON event_logs(board_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_board_collaborators_user_id ON board_collaborators(user_id);
CREATE INDEX idx_board_collaborators_board_id ON board_collaborators(board_id);
```

---

## 🔐 Authentication Flow

### Google SSO Flow
```
1. User clicks "Sign in with Google"
   ↓
2. Redirect to Google OAuth consent screen
   ↓
3. User approves
   ↓
4. Google redirects to callback URL with code
   ↓
5. Backend exchanges code for access token
   ↓
6. Backend fetches user profile from Google
   ↓
7. Backend creates/updates user in database
   ↓
8. Backend generates JWT token
   ↓
9. Frontend stores JWT in httpOnly cookie
   ↓
10. Redirect to dashboard
```

### Email/Password Flow
```
Registration:
1. User submits email + password
   ↓
2. Backend validates input
   ↓
3. Backend hashes password (bcrypt)
   ↓
4. Backend creates user record
   ↓
5. Backend sends verification email
   ↓
6. User clicks verification link
   ↓
7. Backend marks email as verified
   ↓
8. User can log in

Login:
1. User submits email + password
   ↓
2. Backend finds user by email
   ↓
3. Backend compares password hash
   ↓
4. Backend generates JWT token
   ↓
5. Frontend stores JWT
   ↓
6. Redirect to dashboard
```

---

## 🛣️ API Endpoints Design

### Authentication Endpoints
```
POST   /api/v1/auth/register           - Email/password registration
POST   /api/v1/auth/login              - Email/password login
POST   /api/v1/auth/logout             - Logout
GET    /api/v1/auth/google             - Initiate Google SSO
GET    /api/v1/auth/google/callback    - Google OAuth callback
POST   /api/v1/auth/refresh            - Refresh JWT token
POST   /api/v1/auth/verify-email       - Verify email address
POST   /api/v1/auth/forgot-password    - Request password reset
POST   /api/v1/auth/reset-password     - Reset password
GET    /api/v1/auth/me                 - Get current user
```

### Board Endpoints
```
GET    /api/v1/boards                  - List user's boards
POST   /api/v1/boards                  - Create new board
GET    /api/v1/boards/:id              - Get board by ID
PUT    /api/v1/boards/:id              - Update board
DELETE /api/v1/boards/:id              - Delete board
POST   /api/v1/boards/:id/duplicate    - Duplicate board
GET    /api/v1/boards/:id/export       - Export board JSON
POST   /api/v1/boards/:id/import       - Import board JSON
```

### Section Endpoints
```
GET    /api/v1/boards/:boardId/sections              - List sections
POST   /api/v1/boards/:boardId/sections              - Create section
GET    /api/v1/boards/:boardId/sections/:id          - Get section
PUT    /api/v1/boards/:boardId/sections/:id          - Update section
DELETE /api/v1/boards/:boardId/sections/:id          - Delete section
PUT    /api/v1/boards/:boardId/sections/:id/lock     - Lock section
PUT    /api/v1/boards/:boardId/sections/:id/unlock   - Unlock section
```

### Post-it Endpoints
```
GET    /api/v1/boards/:boardId/postits               - List post-its
POST   /api/v1/boards/:boardId/postits               - Create post-it
GET    /api/v1/boards/:boardId/postits/:id           - Get post-it
PUT    /api/v1/boards/:boardId/postits/:id           - Update post-it
DELETE /api/v1/boards/:boardId/postits/:id           - Delete post-it
PUT    /api/v1/boards/:boardId/postits/:id/move      - Move post-it
```

### Collaboration Endpoints
```
GET    /api/v1/boards/:boardId/collaborators         - List collaborators
POST   /api/v1/boards/:boardId/collaborators         - Invite collaborator
DELETE /api/v1/boards/:boardId/collaborators/:userId - Remove collaborator
PUT    /api/v1/boards/:boardId/collaborators/:userId - Update permissions
```

### Team Members Endpoints
```
GET    /api/v1/boards/:boardId/team                  - List team members
POST   /api/v1/boards/:boardId/team                  - Add team member
PUT    /api/v1/boards/:boardId/team/:id              - Update team member
DELETE /api/v1/boards/:boardId/team/:id              - Remove team member
```

### Event Log Endpoints
```
GET    /api/v1/boards/:boardId/events                - Get event log
```

---

## 🔒 Security Considerations

### Authentication Security
- ✅ JWT tokens with short expiry (15 minutes)
- ✅ Refresh tokens with longer expiry (7 days)
- ✅ httpOnly cookies for token storage
- ✅ CSRF protection
- ✅ Rate limiting on auth endpoints
- ✅ Password strength requirements (min 8 chars, complexity)
- ✅ bcrypt for password hashing (cost factor 12)
- ✅ Email verification required

### API Security
- ✅ HTTPS only (enforce with HSTS)
- ✅ CORS properly configured
- ✅ Request size limits
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (input sanitization)
- ✅ Rate limiting per user
- ✅ Input validation on all endpoints

### Data Security
- ✅ Multi-tenancy with row-level security
- ✅ Encrypted database connections
- ✅ Regular backups
- ✅ Audit logging
- ✅ GDPR compliance (data export/deletion)

---

## 💰 Cost Estimation

### Free Tier (MVP - 0-100 users)
```
Hosting:
- Backend: Render Free or Railway Free      £0/month
- Database: Supabase Free (500MB)           £0/month
- Redis: Upstash Free                       £0/month
- Domain: Cloudflare (optional)             £0/month
TOTAL: £0/month
```

### Starter Tier (100-1000 users)
```
Hosting:
- Backend: Railway Hobby Plan               $5/month
- Database: Supabase Pro (8GB)              $25/month
- Redis: Upstash Pro                        $10/month
- Monitoring: Sentry (free tier)            £0/month
- CDN: Cloudflare (free tier)               £0/month
TOTAL: ~£35/month (~$40/month)
```

### Growth Tier (1000+ users)
```
Hosting:
- Backend: Railway Pro or Render Standard   $20-50/month
- Database: Supabase Pro (larger)           $50-100/month
- Redis: Upstash Pro                        $20/month
- Monitoring: Sentry Team                   $26/month
- CDN: Cloudflare Pro                       $20/month
TOTAL: ~£120-200/month (~$140-230/month)
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Backend Setup**
- [ ] Set up Node.js/Express project with TypeScript
- [ ] Configure PostgreSQL database
- [ ] Set up Prisma ORM
- [ ] Create database schema
- [ ] Set up Redis for sessions
- [ ] Configure environment variables
- [ ] Set up basic error handling
- [ ] Add logging (Winston/Pino)

**Deliverables**: Working backend API skeleton

### Phase 2: Authentication (Week 3-4)
**Email/Password Auth**
- [ ] Implement user registration endpoint
- [ ] Implement password hashing (bcrypt)
- [ ] Implement login endpoint
- [ ] Implement JWT token generation
- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Add refresh token mechanism

**Google SSO**
- [ ] Set up Google OAuth app
- [ ] Implement Google OAuth flow
- [ ] Create OAuth callback handler
- [ ] Link Google accounts to users

**Frontend Integration**
- [ ] Create login page
- [ ] Create registration page
- [ ] Create dashboard layout
- [ ] Add authentication state management
- [ ] Add protected routes
- [ ] Add logout functionality

**Deliverables**: Complete authentication system

### Phase 3: Board Management (Week 5-6)
**Backend**
- [ ] Implement board CRUD endpoints
- [ ] Implement section CRUD endpoints
- [ ] Implement post-it CRUD endpoints
- [ ] Add data validation
- [ ] Add authorization checks
- [ ] Implement board import/export

**Frontend**
- [ ] Create dashboard page (list boards)
- [ ] Modify board.js to use API
- [ ] Replace localStorage with API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add auto-save with API sync

**Deliverables**: Working board system with persistence

### Phase 4: Collaboration (Week 7-8)
**Backend**
- [ ] Implement collaborator endpoints
- [ ] Add permission system
- [ ] Add board sharing logic
- [ ] Implement real-time updates (Socket.io - optional)

**Frontend**
- [ ] Add "Share" button and modal
- [ ] Add collaborator management UI
- [ ] Add real-time collaboration (optional)

**Deliverables**: Board sharing capabilities

### Phase 5: Polish & Deploy (Week 9-12)
**Backend**
- [ ] Add comprehensive error handling
- [ ] Add rate limiting
- [ ] Add monitoring and logging
- [ ] Write API tests
- [ ] Performance optimization
- [ ] Security audit

**Frontend**
- [ ] Add loading indicators
- [ ] Add error messages
- [ ] Add success notifications
- [ ] Add user onboarding
- [ ] Add help documentation
- [ ] Browser testing

**Infrastructure**
- [ ] Set up production environment
- [ ] Configure CI/CD pipeline
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Add SSL certificates
- [ ] Performance testing
- [ ] Security testing

**Deliverables**: Production-ready SaaS application

---

## 🚀 Deployment Strategy

### Option 1: All-in-One (Recommended for MVP)
**Platform**: Railway or Render
```
Advantages:
- Simple setup
- One platform for everything
- Built-in PostgreSQL
- Easy scaling
- Good free tier

Setup:
1. Push code to GitHub
2. Connect Railway/Render to repo
3. Configure environment variables
4. Deploy
```

### Option 2: Supabase Backend
**Platform**: Supabase (BaaS)
```
Advantages:
- Built-in auth (including Google SSO)
- Built-in database (PostgreSQL)
- Built-in real-time
- Built-in storage
- Generous free tier

Setup:
1. Create Supabase project
2. Use Supabase client in frontend
3. Optional: Custom backend API
4. Deploy frontend to Vercel/Netlify
```

### Option 3: Microservices (for future scale)
```
Frontend: Vercel/Netlify
Backend: Railway/Render
Database: Supabase/Neon
Cache: Upstash Redis
Storage: Cloudflare R2
CDN: Cloudflare
```

---

## 🧪 Testing Strategy

### Backend Testing
```
Unit Tests:
- Authentication logic
- Password hashing
- Token generation
- Data validation

Integration Tests:
- API endpoints
- Database operations
- Authentication flow
- Authorization checks

Tools:
- Jest or Vitest
- Supertest for API testing
- Testing library setup
```

### Frontend Testing
```
Unit Tests:
- Utility functions
- Data formatting

Integration Tests:
- User flows
- API integration
- Authentication

E2E Tests:
- Full user journey
- Critical paths

Tools:
- Playwright or Cypress
- Testing Library
```

---

## 📊 Migration Strategy

### From localStorage to Database

**Step 1: Export Existing Boards**
```javascript
// Add to current frontend
function exportAllBoards() {
    const boards = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('vimplBoard')) {
            boards.push({
                key: key,
                data: JSON.parse(localStorage.getItem(key))
            });
        }
    }
    return boards;
}
```

**Step 2: Import to New System**
```javascript
// Add to new frontend
async function importFromLocalStorage() {
    const boards = exportAllBoards();
    for (const board of boards) {
        await fetch('/api/v1/boards/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(board.data)
        });
    }
}
```

---

## 🎨 User Experience Changes

### Before (PoC)
- No login required
- Single local board
- No collaboration
- Data lost if browser cleared

### After (SaaS v1)
- Login required
- Multiple boards per user
- Board sharing
- Persistent data
- Access from any device
- Better performance (no local storage limits)

---

## ⚠️ Critical Decisions Needed

1. **Backend Framework**:
   - Node.js + Express (familiar, mature)
   - Supabase (faster development, less code)
   - Your preference?

2. **Hosting**:
   - Railway (simpler, good free tier)
   - Render (more features)
   - Supabase (all-in-one)
   - AWS/Azure (more complex, scalable)

3. **Real-time Collaboration**:
   - Include in v1? (adds complexity)
   - Defer to v1.1?

4. **Pricing Model**:
   - Freemium (free + paid tiers)?
   - Subscription only?
   - Free during beta?

---

## 🎯 Success Metrics

### Technical KPIs
- API response time < 200ms (p95)
- Uptime > 99.9%
- Zero critical security vulnerabilities
- Database query time < 50ms (p95)

### Business KPIs
- User registration conversion > 20%
- User activation (create first board) > 60%
- Weekly active users > 30% of total
- Average boards per user > 2

---

## 📚 Next Steps

1. **Review this plan** and provide feedback
2. **Make critical decisions** (framework, hosting, etc.)
3. **Set up development environment**
4. **Start with Phase 1** (foundation)

**Would you like me to start implementing any specific phase?**
