# 🚀 START HERE - Quick Setup Checklist

Follow these steps in order. Check off each one as you complete it.

---

## Prerequisites (5 minutes)

- [ ] **Node.js 18+** installed
  ```bash
  node -v  # Should show v18 or higher
  ```
  If not installed: Download from [nodejs.org](https://nodejs.org/)

- [ ] **Terminal/Command Prompt** open

- [ ] **Code editor** ready (VS Code recommended)

---

## Step 1: Get a Free Database (10 minutes)

- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Click "Start your project"
- [ ] Sign in with GitHub
- [ ] Click "New Project"
- [ ] Fill in:
  - Name: `vimpl-backend`
  - Click "Generate a password" (SAVE THIS!)
  - Region: Choose closest to you
  - Plan: Free
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for setup
- [ ] When ready, go to Settings (⚙️) → Database
- [ ] Copy the "URI" connection string
- [ ] Replace `[YOUR-PASSWORD]` with your saved password

**Need help?** See [SUPABASE_GUIDE.md](SUPABASE_GUIDE.md)

---

## Step 2: Run Setup Script (5 minutes)

Open terminal and run:

```bash
# Navigate to backend folder
cd vimpl-saas/backend

# Run automated setup
bash setup.sh
```

The script will:
1. ✅ Check Node.js version
2. ✅ Install dependencies (~2 minutes)
3. ✅ Create .env file
4. ✅ Generate secure secrets
5. ⏸️ PAUSE and ask you to add DATABASE_URL

**When it pauses:**

- [ ] Open `.env` file in your editor
- [ ] Find the `DATABASE_URL` line
- [ ] Paste your Supabase connection string
- [ ] Save the file
- [ ] Press Enter to continue

The script will then:
6. ✅ Generate Prisma client
7. ✅ Create database tables
8. ✅ Show success message

---

## Step 3: Start the Server (1 minute)

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3001 in development mode
📍 API available at http://localhost:3001/api/v1
💚 Health check at http://localhost:3001/health
```

**Keep this terminal window open!**

---

## Step 4: Test the API (2 minutes)

Open a **NEW** terminal window:

```bash
cd vimpl-saas/backend
bash test-api.sh
```

You should see:
```
🧪 vimpl API Test Suite
Testing: Health check... PASSED
Testing: User registration... PASSED
Testing: User login... PASSED
...
✅ All tests passed! Your API is working correctly.
```

---

## Step 5: View Your Data (Optional)

Open Prisma Studio to see your database:

```bash
npm run db:studio
```

Opens `http://localhost:5555` in your browser where you can:
- See all tables
- View test data created by the tests
- Edit data directly

---

## ✅ Success! What You Have Now

Your backend is running with:

- ✅ User authentication (email/password + Google SSO ready)
- ✅ PostgreSQL database in the cloud
- ✅ RESTful API with all CRUD operations
- ✅ JWT token-based security
- ✅ Multi-tenant architecture
- ✅ Auto-saving to database

**API is running at:** `http://localhost:3001/api/v1`

---

## 🎯 Next Steps

Choose your path:

### Option A: Test More Features (Recommended)

Use any API client to test endpoints:

**Postman:**
1. Download from [postman.com](https://www.postman.com/downloads/)
2. Import the API endpoints from backend/README.md
3. Test creating boards, sections, post-its

**Or use curl:**
```bash
# Register a new user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPass123","name":"Your Name"}'

# Create a board (use token from registration)
curl -X POST http://localhost:3001/api/v1/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"My First Board","description":"Testing"}'
```

### Option B: Set Up Google OAuth (Optional)

Follow instructions in [backend/README.md](backend/README.md) section "Google OAuth Setup"

### Option C: Start Frontend Integration

You can now:
1. Create login/registration pages
2. Build API client wrapper
3. Connect your existing vimpl board.js to the API
4. Replace localStorage with API calls

**I can help you with this next!**

### Option D: Deploy to Production

Follow [DEPLOYMENT.md](../vimpl-saas-plan.md#deployment-strategy) to deploy to Railway

---

## 🐛 Troubleshooting

### Setup script fails

Run manual setup instead:
```bash
# See detailed step-by-step guide
cat SETUP_GUIDE.md
```

### Can't connect to database

1. Check your DATABASE_URL in `.env`
2. Make sure you replaced `[YOUR-PASSWORD]`
3. Verify Supabase project is running
4. See [SUPABASE_GUIDE.md](SUPABASE_GUIDE.md)

### Port 3001 already in use

```bash
# Kill the process and restart
lsof -ti:3001 | xargs kill
npm run dev
```

### Tests fail

1. Make sure backend is running (`npm run dev` in another terminal)
2. Check backend logs for errors
3. Verify .env configuration
4. Try running tests again

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Detailed manual setup instructions |
| [SUPABASE_GUIDE.md](SUPABASE_GUIDE.md) | Visual database setup guide |
| [README.md](README.md) | Complete API documentation |
| [../IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md) | Full SaaS transformation guide |

---

## 💡 Quick Commands

```bash
# Start development server
npm run dev

# Run tests
bash test-api.sh

# View database
npm run db:studio

# Check logs
# (they're in the terminal where you ran npm run dev)

# Stop server
# Press Ctrl+C in the terminal
```

---

## ❓ Need Help?

If you get stuck:

1. Check the error message in the terminal
2. Look at [SETUP_GUIDE.md](SETUP_GUIDE.md) troubleshooting section
3. Review [SUPABASE_GUIDE.md](SUPABASE_GUIDE.md) for database issues
4. Make sure all checkboxes above are completed

---

## 🎉 Congratulations!

You have a production-ready backend API running!

**What's working:**
- User registration and login
- JWT authentication
- Board management
- Sections and post-its
- Database persistence
- Security measures

**Next:** Time to build the frontend integration! 🚀

---

**Ready to continue?** Let me know and I can help you with frontend integration or deployment!
