# vimpl Backend - Quick Reference Card

Print this out or keep it handy! 📋

---

## 🚀 Starting & Stopping

```bash
# Start development server (with auto-reload)
npm run dev

# Stop server
Press Ctrl+C

# Start production server
npm run build
npm start
```

---

## 🔍 Viewing Data

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio
# Opens http://localhost:5555

# Check health
curl http://localhost:3001/health

# Run full test suite
bash test-api.sh
```

---

## 🗄️ Database Commands

```bash
# Generate Prisma client (after schema changes)
npm run db:generate

# Push schema changes to database
npm run db:push

# Create new migration
npm run db:migrate

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset
```

---

## 🔐 Authentication Endpoints

### Register
```bash
POST /api/v1/auth/register
Body: {"email":"user@example.com","password":"Pass123","name":"Name"}
```

### Login
```bash
POST /api/v1/auth/login
Body: {"email":"user@example.com","password":"Pass123"}
Returns: {"accessToken":"..."}
```

### Get Current User
```bash
GET /api/v1/auth/me
Header: Authorization: Bearer {token}
```

### Logout
```bash
POST /api/v1/auth/logout
```

### Refresh Token
```bash
POST /api/v1/auth/refresh
Cookie: refreshToken
```

---

## 📋 Board Endpoints

All board endpoints require `Authorization: Bearer {token}` header.

### List Boards
```bash
GET /api/v1/boards
```

### Create Board
```bash
POST /api/v1/boards
Body: {"title":"Board Name","description":"Optional description"}
```

### Get Board
```bash
GET /api/v1/boards/{boardId}
```

### Update Board
```bash
PUT /api/v1/boards/{boardId}
Body: {"title":"New Title"}
```

### Delete Board
```bash
DELETE /api/v1/boards/{boardId}
```

---

## 📦 Section Endpoints

All require `Authorization: Bearer {token}` header.

### Create Section
```bash
POST /api/v1/boards/{boardId}/sections
Body: {
  "type":"matrix",
  "title":"Section Name",
  "positionX":0,
  "positionY":0,
  "width":6,
  "height":4
}
```

### Update Section
```bash
PUT /api/v1/boards/{boardId}/sections/{sectionId}
Body: {"title":"Updated Title","isLocked":true}
```

### Delete Section
```bash
DELETE /api/v1/boards/{boardId}/sections/{sectionId}
```

---

## 📝 Post-it Endpoints

All require `Authorization: Bearer {token}` header.

### Create Post-it
```bash
POST /api/v1/boards/{boardId}/postits
Body: {
  "sectionId":"section-uuid",
  "color":"yellow",
  "content":"Note content",
  "status":"todo",
  "positionX":100,
  "positionY":200
}
```

### Update Post-it
```bash
PUT /api/v1/boards/{boardId}/postits/{postitId}
Body: {"content":"Updated content","status":"done"}
```

### Delete Post-it
```bash
DELETE /api/v1/boards/{boardId}/postits/{postitId}
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |
| Prisma Studio | http://localhost:5555 |
| Supabase Dashboard | https://app.supabase.com |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | Configuration (DATABASE_URL, secrets) |
| `src/server.ts` | Main server file |
| `prisma/schema.prisma` | Database schema |
| `package.json` | Dependencies and scripts |

---

## 🔧 Environment Variables

```env
# Required
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Optional
PORT=3001
NODE_ENV=development
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Port in use | `lsof -ti:3001 \| xargs kill` |
| Can't connect to DB | Check DATABASE_URL in .env |
| Module not found | `rm -rf node_modules && npm install` |
| Prisma errors | `npm run db:generate` |
| Tests fail | Make sure server is running |

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| users | User accounts |
| boards | User boards |
| sections | Board sections |
| postits | Post-it notes |
| team_members | Team references |
| board_collaborators | Board sharing |
| event_logs | Activity logs |
| sessions | User sessions |

---

## 🔑 JWT Token Flow

```
1. User logs in
   ↓
2. Server generates:
   - Access token (15 min expiry)
   - Refresh token (7 day expiry)
   ↓
3. Frontend stores access token
4. Backend sets refresh token cookie
   ↓
5. All requests include: Authorization: Bearer {accessToken}
   ↓
6. When access token expires:
   - POST /api/v1/auth/refresh
   - Get new access token
```

---

## 🚦 Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not found |
| 500 | Server error |

---

## 📦 Useful npm Scripts

```bash
npm run dev          # Start with auto-reload
npm run build        # Build for production
npm start            # Start production
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
npm test             # Run tests
npm run lint         # Check for errors
```

---

## 🧪 Testing with curl

```bash
# Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Save the token from response
TOKEN="your-token-here"

# Create board
curl -X POST http://localhost:3001/api/v1/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My Board"}'

# List boards
curl http://localhost:3001/api/v1/boards \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📖 Documentation Links

- [START_HERE.md](START_HERE.md) - Quick setup checklist
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
- [SUPABASE_GUIDE.md](SUPABASE_GUIDE.md) - Database setup
- [README.md](README.md) - Full API docs

---

## 💡 Pro Tips

1. **Keep server running** - Changes to code auto-reload
2. **Check logs** - Server logs all requests and errors
3. **Use Prisma Studio** - Easiest way to view/edit data
4. **Test with script** - Run `bash test-api.sh` after changes
5. **Monitor health** - Check `/health` endpoint
6. **Use httpOnly cookies** - Refresh token is stored securely

---

**Keep this handy for quick reference!** 📌
