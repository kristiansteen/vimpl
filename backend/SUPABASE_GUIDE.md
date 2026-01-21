# Supabase Database Setup - Visual Guide

This guide shows you exactly how to get your free PostgreSQL database from Supabase.

## Why Supabase?

✅ **Free tier** - 500MB database, perfect for development  
✅ **No credit card** required  
✅ **Instant setup** - ready in 2 minutes  
✅ **PostgreSQL** - industry standard  
✅ **Dashboard** - view your data easily  
✅ **Automatic backups**  

---

## Step-by-Step Setup

### 1. Create Supabase Account

1. Go to: **https://supabase.com**
2. Click **"Start your project"**
3. Choose sign-in method:
   - **GitHub** (recommended - one click)
   - Or email

**Screenshot location:** Top right corner shows "Start your project" button

---

### 2. Create New Project

After signing in:

1. Click **"New Project"** (green button)

2. Fill in project details:
   ```
   Organization: [Your account name] (auto-selected)
   Project name: vimpl-backend
   Database Password: [Click "Generate a password"]
   Region: Choose closest to you:
     - Europe: West EU (London)
     - US: East US (N. Virginia)
     - Asia: Southeast Asia (Singapore)
   Pricing Plan: Free
   ```

3. **IMPORTANT:** Copy and save your database password!
   - Click the 👁️ icon to reveal it
   - Copy it to a safe place (you'll need it in step 4)
   - You cannot retrieve this password later!

4. Click **"Create new project"**

5. Wait 2-3 minutes while Supabase provisions your database
   - You'll see a progress indicator
   - The page will refresh when ready

---

### 3. Get Your Connection String

Once your project is ready:

1. Click the **⚙️ Settings** icon (bottom left sidebar)

2. Click **"Database"** in the settings menu

3. Scroll down to the **"Connection string"** section

4. You'll see several tabs:
   - URI
   - JDBC
   - .NET
   - etc.

5. Click the **"URI"** tab (should be selected by default)

6. You'll see a connection string like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres
   ```

7. **Copy this entire string**

8. **Replace `[YOUR-PASSWORD]`** with the password you saved in step 2

   For example, if your password is `MySecretPass123`, change:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abc...
   ```
   to:
   ```
   postgresql://postgres:MySecretPass123@db.abc...
   ```

---

### 4. Add to Your Backend

1. Open your `vimpl-saas/backend/.env` file

2. Find the line that says:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/vimpl?schema=public"
   ```

3. Replace it with your Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres:MySecretPass123@db.abcdefghijklm.supabase.co:5432/postgres"
   ```

4. Save the file

---

### 5. Test Connection

In your terminal:

```bash
cd vimpl-saas/backend
npm run db:push
```

**Expected output:**
```
🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

If you see this, **your database is connected!** 🎉

---

## Visual Reference - What You'll See

### Supabase Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│ [Logo] Supabase        [Search]    [User Menu]      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Sidebar:              Main Content:                │
│  ┌──────────┐         ┌─────────────────────┐      │
│  │ 📊 Home   │         │ Project Overview    │      │
│  │ 🗄️ Tables │         │                     │      │
│  │ 🔐 Auth   │         │ Your database is    │      │
│  │ 💾 Storage│         │ ready to use!       │      │
│  │ 🔌 API    │         │                     │      │
│  │ ⚙️ Settings│        └─────────────────────┘      │
│  └──────────┘                                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Database Settings Page

```
Settings > Database

Connection string
┌─────────────────────────────────────────────────┐
│ [URI] [JDBC] [.NET] [Golang] [Python]          │
├─────────────────────────────────────────────────┤
│                                                  │
│ postgresql://postgres:[YOUR-PASSWORD]@          │
│ db.abcdefghijklm.supabase.co:5432/postgres      │
│                                                  │
│ [Copy]                                           │
└─────────────────────────────────────────────────┘
```

---

## Viewing Your Data

Once you've set up your backend and created some data:

1. Go to Supabase dashboard
2. Click **"Table Editor"** in sidebar
3. You'll see all your tables:
   - users
   - boards
   - sections
   - postits
   - etc.

Click any table to view/edit data directly in the browser!

---

## Important Notes

### Connection String Format

Your connection string has these parts:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

For Supabase:
- User: `postgres`
- Password: The one you generated
- Host: `db.[project-id].supabase.co`
- Port: `5432` (standard PostgreSQL port)
- Database: `postgres`

### Security Tips

🔒 **Never commit .env file to Git**
- It's already in .gitignore
- Contains your database password

🔒 **Use different passwords for development and production**
- Create separate Supabase projects

🔒 **Keep your connection string secret**
- Don't share it publicly
- Don't paste it in Discord/Slack

---

## Troubleshooting

### "Cannot connect to database"

**Check:**
1. Is your password correct in DATABASE_URL?
2. Did you replace `[YOUR-PASSWORD]`?
3. Is there a typo in the connection string?
4. Is your Supabase project running? (check dashboard)

**Test manually:**
```bash
# Install psql if needed (Mac)
brew install postgresql

# Test connection
psql "your-connection-string-here"
```

### "Project not ready"

If you just created the project:
- Wait 2-3 minutes
- Refresh the Supabase dashboard
- The progress bar will disappear when ready

### "Password not showing"

If you closed the password popup:
- You'll need to reset it
- Settings > Database > Database Settings
- Click "Reset database password"
- Generate a new one

---

## Alternative: Local PostgreSQL

If you prefer a local database:

### Mac (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
createdb vimpl
```

Your DATABASE_URL:
```
postgresql://your-username@localhost:5432/vimpl
```

### Windows (using installer)
1. Download from postgresql.org
2. Install with default settings
3. Create database using pgAdmin

### Ubuntu/Debian
```bash
sudo apt install postgresql
sudo -u postgres createdb vimpl
```

---

## Next Steps

Once your database is connected:

1. ✅ Run `npm run db:push` to create tables
2. ✅ Run `npm run dev` to start backend
3. ✅ Run `bash test-api.sh` to test API
4. ✅ Open Prisma Studio: `npm run db:studio`

---

## Quick Reference

| Task | Command |
|------|---------|
| Create tables | `npm run db:push` |
| View database | `npm run db:studio` |
| Test connection | `psql "$DATABASE_URL"` |
| Reset database | `npx prisma migrate reset` |

---

**Need help?** Check SETUP_GUIDE.md or the troubleshooting section.
