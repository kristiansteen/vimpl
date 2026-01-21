# Your vimpl Backend Setup - Personalized Instructions

I've pre-configured your Supabase connection string! Just one more step needed.

---

## ✅ Already Done

Your `.env` file has been created with your Supabase project:
```
Project ID: tawzmizcsgbkousquasb
Database URL: postgresql://postgres:[YOUR-PASSWORD]@db.tawzmizcsgbkousquasb.supabase.co:5432/postgres
```

---

## 🔐 What You Need to Do

### 1. Get Your Database Password

You need to find or reset your Supabase database password:

**Option A: If you remember your password**
- Just use it in step 2 below

**Option B: If you don't remember it (or just created the project)**
1. Go to [https://app.supabase.com/project/tawzmizcsgbkousquasb](https://app.supabase.com/project/tawzmizcsgbkousquasb)
2. Click **Settings** (⚙️) in the left sidebar
3. Click **Database**
4. Scroll to "Database password"
5. Click **"Reset database password"**
6. Click **"Generate a password"** or enter your own
7. **SAVE THIS PASSWORD!** Copy it somewhere safe
8. Click **"Reset password"**

### 2. Update Your .env File

Open `vimpl-saas/backend/.env` in your editor and find this line:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.tawzmizcsgbkousquasb.supabase.co:5432/postgres"
```

Replace `[YOUR-PASSWORD]` with your actual password.

**Example:**
If your password is `MySecret123`, change it to:
```env
DATABASE_URL="postgresql://postgres:MySecret123@db.tawzmizcsgbkousquasb.supabase.co:5432/postgres"
```

**Important:** 
- No spaces
- Keep the quotation marks
- Make sure there are no extra characters

---

## 🚀 Next Steps (5 minutes)

Once you've updated the password in `.env`:

```bash
# Navigate to backend directory
cd vimpl-saas/backend

# Install dependencies
npm install

# Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and update JWT_SECRET in .env

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and update JWT_REFRESH_SECRET in .env

# Set up database tables
npm run db:generate
npm run db:push

# Start the server
npm run dev
```

You should see:
```
🚀 Server running on port 3001 in development mode
📍 API available at http://localhost:3001/api/v1
💚 Health check at http://localhost:3001/health
```

---

## 🧪 Test Everything Works

Open a **new terminal** and run:

```bash
cd vimpl-saas/backend

# Test the API
bash test-api.sh
```

You should see all tests passing! ✅

---

## 🎯 Quick Test

Try this in your browser or terminal:

**Browser:**
Open: http://localhost:3001/health

**Terminal:**
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-01-07T...",
  "uptime": 5.123,
  "environment": "development"
}
```

---

## 📊 View Your Database

Once the server is running, you can view your database:

```bash
npm run db:studio
```

Opens at http://localhost:5555

You'll see all your tables:
- users
- boards
- sections
- postits
- team_members
- board_collaborators
- event_logs
- sessions

---

## 🐛 Troubleshooting

### "Cannot connect to database"

**Check:**
1. Did you replace `[YOUR-PASSWORD]` in .env?
2. Is your Supabase project running? Check: https://app.supabase.com/project/tawzmizcsgbkousquasb
3. Is the password correct?

**Test connection manually:**
```bash
# Replace YOUR_PASSWORD with actual password
psql "postgresql://postgres:YOUR_PASSWORD@db.tawzmizcsgbkousquasb.supabase.co:5432/postgres"
```

If this works, your connection string is correct!

### "Port 3001 already in use"

```bash
lsof -ti:3001 | xargs kill
npm run dev
```

### "Module not found" errors

```bash
rm -rf node_modules
npm install
```

---

## ✅ Success Checklist

Once everything is working, you should have:

- [ ] `.env` file updated with your database password
- [ ] JWT secrets generated and added to `.env`
- [ ] Dependencies installed (`npm install`)
- [ ] Database tables created (`npm run db:push`)
- [ ] Server running on port 3001
- [ ] Health check responding at `/health`
- [ ] All tests passing (`bash test-api.sh`)
- [ ] Prisma Studio accessible (`npm run db:studio`)

---

## 🎉 You're Ready!

Once all checkboxes are ticked, your backend is fully operational!

**What you have:**
- ✅ User authentication (register, login, logout)
- ✅ JWT token-based security
- ✅ Board management API
- ✅ Sections and post-its
- ✅ Cloud database (Supabase)
- ✅ Multi-tenant architecture

**Next step:** Frontend integration! Let me know when you're ready and I'll help you connect your existing vimpl board to the API.

---

## 📞 Need Help?

If you get stuck:
1. Check the error message carefully
2. Review this file's troubleshooting section
3. See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
4. See [SUPABASE_GUIDE.md](SUPABASE_GUIDE.md) for database help

---

**Your Supabase Project URL:**
https://app.supabase.com/project/tawzmizcsgbkousquasb

**Your API URL (when running):**
http://localhost:3001/api/v1

**Quick Reference:**
See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for all commands and endpoints
