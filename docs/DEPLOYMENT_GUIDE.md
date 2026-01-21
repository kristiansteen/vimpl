# Deployment Guide

This guide explains how to deploy your Vimpl SaaS application.

## 1. Quick Deployment (Frontend Only)

Your frontend is currently configured in **Mock Mode**, meaning it simulates a backend and saves data to the browser's LocalStorage. This makes it very easy to demo.

### Deploy to Vercel
1.  Go to [Vercel.com](https://vercel.com) and sign up/login.
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your GitHub repository (`kristiansteen/vimpl`).
4.  **Important**: In the configuration screen, find **"Root Directory"**.
    *   Click "Edit" and select the `frontend` folder.
5.  Click **Deploy**.

**Result**: You will have a live URL (e.g., `vimpl.vercel.app`) where your app works perfectly (in demo/mock mode).

---

## 2. Full Stack Deployment (Frontend + Backend)

To use your real Node.js backend and Supabase database, follow these steps.

### Step A: Deploy Backend to Render
1.  Go to [Render.com](https://render.com) and sign up/login.
2.  Click **"New"** -> **"Web Service"**.
3.  Connect your GitHub repository.
4.  **Settings**:
    *   **Root Directory**: `backend`
    *   **Build Command**: `npm install` (or `npm install && npm run build` if using TypeScript)
    *   **Start Command**: `npm start`
5.  **Environment Variables**:
    *   Scroll down to "Environment Variables".
    *   Add the keys from your local `.env` file (e.g., `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SESSION_SECRET`).
    *   **Note**: Use the "Transaction Mode" connection string for `DATABASE_URL` (port 6543) for best compatibility.
6.  Click **Create Web Service**.
7.  **Copy your Backend URL**: Once deployed, Render gives you a URL (e.g., `https://vimpl-backend.onrender.com`).

### Step B: Connect Frontend to Backend
Currently, your `api-client.js` is set to Mock Mode. To use the real backend:

1.  **Edit `frontend/assets/js/api-client.js`**:
    *   Disable the mock backend.
    *   Update `baseURL` to your new Render URL (`https://vimpl-backend.onrender.com/api/v1`).
    *   Ensure methods use `fetch()` to hit the API endpoints instead of `this.mockBackend`.
2.  **Push Changes**: Commit and push these changes to GitHub. Vercel will automatically redeploy the frontend.

## Summary

| Component | Host | Setup Difficulty | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel / Netlify | Easy | **Ready** (Mock Mode) |
| **Backend** | Render / Railway | Medium | **Ready** (Needs Env Vars) |
| **Database** | Supabase | Done | **Ready** |
