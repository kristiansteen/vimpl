# Google OAuth Setup Guide

Quick guide to enable "Sign in with Google" functionality.

---

## 🎯 What You Need

1. Google Cloud account (free)
2. 10 minutes
3. Google Client ID and Secret

---

## 📝 Step-by-Step Setup

### Step 1: Go to Google Cloud Console

Visit: https://console.cloud.google.com/

### Step 2: Create New Project

1. Click **"Select a project"** (top left)
2. Click **"New Project"**
3. **Name:** `vimpl-app`
4. Click **"Create"**
5. Wait for project to be created
6. **Select the project**

### Step 3: Enable OAuth

1. In left menu, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have Google Workspace)
3. Click **"Create"**

### Step 4: Configure OAuth Consent Screen

**App information:**
- **App name:** `vimpl`
- **User support email:** (your email)
- **Developer contact:** (your email)

**Leave everything else default**

Click **"Save and Continue"**

**Scopes:**
- Click **"Save and Continue"** (no changes needed)

**Test users (optional):**
- Add your email for testing
- Click **"Save and Continue"**

Click **"Back to Dashboard"**

### Step 5: Create OAuth Credentials

1. In left menu, go to **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. **Application type:** Web application
4. **Name:** `vimpl-web-client`

**Authorized JavaScript origins:**
```
http://localhost:3001
http://localhost:8000
http://localhost:5173
```

**Authorized redirect URIs:**
```
http://localhost:3001/api/v1/auth/google/callback
```

5. Click **"Create"**

### Step 6: Copy Credentials

A popup appears with your credentials:
- **Client ID:** Copy this (looks like: `123456789-abc123.apps.googleusercontent.com`)
- **Client Secret:** Copy this (looks like: `GOCSPX-abc123xyz789`)

**Save these somewhere safe!**

---

## 🔧 Step 7: Update Backend .env

```cmd
cd C:\Users\KristianSteen\vimpl-saas\backend
notepad .env
```

**Find these lines** (around line 14-17):
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
```

**Update with your credentials:**
```env
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz789
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
```

**Save** and close.

---

## 🔄 Step 8: Restart Backend

Close backend terminal and restart:
```cmd
cd C:\Users\KristianSteen\vimpl-saas\backend
npm run dev
```

You should see:
```
✅ Google OAuth configured
```

Instead of the warning about missing credentials.

---

## ✅ Step 9: Test

Once we create the login page, the **"Sign in with Google"** button will work!

---

## 🚨 Important Notes

### For Development:
- ✅ Use `http://localhost` URLs
- ✅ Add your email as test user
- ✅ App is in "Testing" mode (only test users can login)

### For Production:
- Need to verify app with Google
- Add production URLs
- Remove "Testing" mode
- Add privacy policy URL

---

## 🆘 Troubleshooting

### "Redirect URI mismatch"
**Fix:** Make sure redirect URI in Google Console exactly matches:
```
http://localhost:3001/api/v1/auth/google/callback
```

### "Access blocked: This app's request is invalid"
**Fix:** Check that:
- OAuth consent screen is configured
- Client ID and Secret are correct in .env
- Backend is restarted after updating .env

### "Sign in with Google button doesn't work"
**Fix:** 
- Check browser console (F12) for errors
- Verify GOOGLE_CLIENT_ID is in .env
- Restart backend server

---

## 📋 Quick Checklist

- [ ] Created Google Cloud project
- [ ] Configured OAuth consent screen
- [ ] Created OAuth client credentials
- [ ] Copied Client ID
- [ ] Copied Client Secret
- [ ] Updated .env file
- [ ] Restarted backend
- [ ] No warnings about Google OAuth

---

## 🎯 What Happens When User Clicks "Sign in with Google"

```
1. User clicks button
   ↓
2. Redirects to Google login
   ↓
3. User signs in with Google
   ↓
4. Google redirects to: /api/v1/auth/google/callback
   ↓
5. Backend creates user account (if new)
   ↓
6. Backend generates JWT token
   ↓
7. Redirects to dashboard with token
   ↓
8. User is logged in!
```

---

## 💡 Alternative: Skip Google OAuth

If you don't want Google SSO yet:
1. Leave GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET empty
2. Login page will only show email/password
3. You can add Google OAuth later anytime

---

**Need help with any step?** Let me know and I'll guide you through it! 🚀
