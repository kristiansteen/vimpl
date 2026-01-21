# 🖥️ Local Server Setup Guide

Complete guide to running vimpl on your local machine.

---

## 🚀 Quick Start (Easiest Way)

### Method 1: Double-Click Startup

1. **Navigate to:**
   ```
   C:\Users\KristianSteen\vimpl-saas\
   ```

2. **Double-click:**
   ```
   START-ALL.bat
   ```

3. **Two windows will open:**
   - Backend server (port 3001)
   - Frontend server (port 8000)

4. **Open browser:**
   ```
   http://localhost:8000/test-api-simple.html
   ```

**That's it!** Everything is running locally.

---

## 📋 Individual Server Control

### Start Backend Only:
**Double-click:** `start-backend.bat`

Or manually:
```cmd
cd C:\Users\KristianSteen\vimpl-saas\backend
npm run dev
```

### Start Frontend Only:
**Double-click:** `start-frontend.bat`

Or manually:
```cmd
cd C:\Users\KristianSteen\vimpl-saas\frontend
python -m http.server 8000
```

---

## 🌐 Access Your Local Server

### From Your Computer:
```
Backend API:     http://localhost:3001
Backend Health:  http://localhost:3001/health
Frontend:        http://localhost:8000
Test Page:       http://localhost:8000/test-api-simple.html
Board App:       http://localhost:8000/board.html
```

### From Other Devices on Same WiFi:
```
Backend:  http://[YOUR-IP]:3001
Frontend: http://[YOUR-IP]:8000
```

**To find your IP address:**
```cmd
ipconfig
```
Look for "IPv4 Address" (usually `192.168.x.x`)

---

## 🛠️ Startup Scripts Explained

### START-ALL.bat
- Starts both backend and frontend
- Opens two Command Prompt windows
- Best for daily development

### start-backend.bat
- Starts only backend server
- Useful when frontend isn't needed
- API available at port 3001

### start-frontend.bat
- Starts only frontend server
- Useful for UI-only work
- Serves static files on port 8000

---

## 🔧 Configuration

### Change Backend Port

**Edit:** `backend/.env`
```env
PORT=3001  # Change to any port you want
```

### Change Frontend Port

**Edit:** `start-frontend.bat`
```batch
python -m http.server 8000  # Change 8000 to any port
```

**Don't forget to update CORS in backend/.env:**
```env
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:YOUR_NEW_PORT
```

---

## 🌍 Access From Other Devices

### On Same WiFi Network:

1. **Find your computer's IP:**
   ```cmd
   ipconfig
   ```
   Example: `192.168.1.100`

2. **Update backend/.env:**
   ```env
   ALLOWED_ORIGINS=http://localhost:8000,http://192.168.1.100:8000
   ```

3. **Restart backend:**
   - Close backend window
   - Double-click `start-backend.bat`

4. **Access from phone/tablet:**
   ```
   http://192.168.1.100:8000/test-api-simple.html
   ```

### Windows Firewall:

You may need to allow Node.js through firewall:

1. **Windows Security** → **Firewall & network protection**
2. **Allow an app through firewall**
3. Find **Node.js**, check both **Private** and **Public**

---

## 🔄 Daily Workflow

### Starting Your Day:
1. Double-click `START-ALL.bat`
2. Wait 5 seconds
3. Open `http://localhost:8000`
4. Start coding!

### Stopping Everything:
1. Close both Command Prompt windows
2. Or press `Ctrl+C` in each window

### Restarting After Code Changes:
**Backend changes:**
- Press `Ctrl+C` in backend window
- Server restarts automatically (nodemon)

**Frontend changes:**
- Just refresh browser (F5)
- No restart needed

---

## 📊 Server Status Check

### Check if Backend is Running:
```cmd
curl http://localhost:3001/health
```

Or open in browser:
```
http://localhost:3001/health
```

Should see:
```json
{"status":"ok","timestamp":"..."}
```

### Check if Frontend is Running:
Open in browser:
```
http://localhost:8000
```

Should see the landing page or directory listing.

---

## 🐛 Troubleshooting

### Problem: "Port already in use"

**Backend (port 3001):**
```cmd
# Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual number)
taskkill /PID [PID] /F
```

**Frontend (port 8000):**
```cmd
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process
taskkill /PID [PID] /F
```

### Problem: "npm is not recognized"

Node.js not in PATH. Restart computer after installing Node.js.

### Problem: "python is not recognized"

Python not installed. Install from: https://www.python.org

Or use `python3` instead of `python`

### Problem: Backend won't connect to database

Check `.env` file:
```cmd
cd C:\Users\KristianSteen\vimpl-saas\backend
type .env
```

Verify DATABASE_URL is correct:
```
DATABASE_URL="postgresql://postgres:yYa49ltmvToUrP8b@db.tawzmizcsgbkousquasb.supabase.co:5432/postgres"
```

### Problem: "Failed to fetch" in browser

1. Check backend is running
2. Check CORS settings in `.env`
3. Refresh browser (Ctrl+F5)

---

## 🎯 Development Modes

### Production Mode (Backend):
```cmd
cd backend
npm run build
npm start
```

### Development Mode (Current):
```cmd
npm run dev
```
- Auto-restarts on changes
- Better error messages
- Source maps enabled

---

## 💾 Keep Backend Running (Advanced)

### Option 1: PM2 (Process Manager)

**Install:**
```cmd
npm install -g pm2
```

**Start:**
```cmd
cd C:\Users\KristianSteen\vimpl-saas\backend
pm2 start npm --name "vimpl-backend" -- run dev
```

**Manage:**
```cmd
pm2 status        # Check status
pm2 stop all      # Stop all
pm2 restart all   # Restart all
pm2 logs          # View logs
```

**Auto-start on boot:**
```cmd
pm2 startup
pm2 save
```

### Option 2: Windows Service (More Advanced)

Use tools like:
- NSSM (Non-Sucking Service Manager)
- node-windows

---

## 🌟 Best Practices

### During Development:
1. ✅ Use `START-ALL.bat` for convenience
2. ✅ Keep terminal windows visible to see errors
3. ✅ Refresh browser to see frontend changes
4. ✅ Backend auto-restarts with nodemon

### For Testing:
1. ✅ Use test-api-simple.html
2. ✅ Check browser console (F12) for errors
3. ✅ Monitor backend terminal for API logs
4. ✅ Use Prisma Studio to view database

### Performance:
1. ✅ Close unused applications
2. ✅ Don't run multiple backend instances
3. ✅ Clear browser cache if issues occur
4. ✅ Restart servers after big changes

---

## 📱 Mobile Development Testing

### Test on Phone/Tablet:

1. **Connect to same WiFi** as your computer

2. **Find your computer's IP:**
   ```cmd
   ipconfig
   ```
   Example: `192.168.1.100`

3. **Update backend CORS:**
   ```env
   ALLOWED_ORIGINS=http://192.168.1.100:8000,http://localhost:8000
   ```

4. **Open on mobile:**
   ```
   http://192.168.1.100:8000/board.html
   ```

5. **Allow firewall** (if blocked)

---

## 🔐 Security Notes

### For Local Development:
- ✅ `localhost` is secure (not accessible externally)
- ✅ `.env` contains secrets (never commit to Git)
- ✅ CORS restricts which sites can access API

### When Allowing Network Access:
- ⚠️ Only use on trusted networks (home/work)
- ⚠️ Don't expose to public internet
- ⚠️ Use strong JWT secrets
- ⚠️ Consider VPN for remote access

---

## 📦 Batch File Locations

```
vimpl-saas/
├── START-ALL.bat          ← Start everything
├── start-backend.bat      ← Backend only
├── start-frontend.bat     ← Frontend only
└── backend/
    └── .env               ← Configuration
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Start everything | Double-click `START-ALL.bat` |
| Start backend | Double-click `start-backend.bat` |
| Start frontend | Double-click `start-frontend.bat` |
| Stop servers | Close terminal windows |
| Restart backend | Ctrl+C, then runs again |
| Check backend | http://localhost:3001/health |
| Test API | http://localhost:8000/test-api-simple.html |

---

## 🆘 Emergency Commands

### Force Kill All Node Processes:
```cmd
taskkill /F /IM node.exe
```

### Force Kill Python Server:
```cmd
taskkill /F /IM python.exe
```

### Clear npm Cache:
```cmd
npm cache clean --force
```

### Reinstall Dependencies:
```cmd
cd backend
rmdir /s /q node_modules
npm install
```

---

## 🎓 Understanding Local Servers

### What is "localhost"?
- `localhost` = Your own computer
- `127.0.0.1` = Same as localhost
- Only you can access it
- Not visible on internet

### What are Ports?
- Port = Door for different services
- 3001 = Backend API
- 8000 = Frontend files
- Can't use same port twice

### Backend vs Frontend:
- **Backend (3001):** API, database, logic
- **Frontend (8000):** HTML, CSS, JavaScript files

---

## ✅ Verification Checklist

After starting servers:

- [ ] Backend window shows "Server running on port 3001"
- [ ] Frontend window shows "Serving HTTP on :: port 8000"
- [ ] http://localhost:3001/health returns JSON
- [ ] http://localhost:8000 shows a page
- [ ] test-api-simple.html shows "Backend Status: Online"
- [ ] Can register user successfully
- [ ] Can login successfully
- [ ] Can create board successfully

**If all checked:** ✅ Your local server is perfect!

---

**Your local development environment is now fully configured!** 🎉

Double-click `START-ALL.bat` and start building! 🚀
