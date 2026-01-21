# Integration Roadmap - Visual Overview

**Quick reference for frontend-backend integration**

---

## 🗺️ Big Picture

```
┌─────────────────────────────────────────────────────────┐
│                     CURRENT STATE                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (board.html)      Backend (API)               │
│  ┌──────────────┐           ┌──────────────┐           │
│  │              │           │              │           │
│  │  board.js    │           │  Express.js  │           │
│  │  uses        │    ❌     │  + Prisma    │           │
│  │  localStorage│  NO LINK  │  + Postgres  │           │
│  │              │           │              │           │
│  └──────────────┘           └──────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     TARGET STATE                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (board.html)      Backend (API)               │
│  ┌──────────────┐           ┌──────────────┐           │
│  │              │           │              │           │
│  │  board.js    │  ──API──> │  Express.js  │           │
│  │  + login.html│  <─JWT──  │  + Prisma    │           │
│  │  + dashboard │  ──HTTP─> │  + Postgres  │           │
│  │              │           │              │           │
│  └──────────────┘           └──────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📅 3-Week Timeline

```
WEEK 1: FOUNDATION
├─ Day 1-2: API Client Wrapper
│  └─ Create api-client.js
│     └─ Test with Postman first
│
├─ Day 3: Login Page
│  └─ login.html + login.js
│     └─ Test authentication flow
│
├─ Day 4: Registration Page
│  └─ register.html + register.js
│     └─ Test new user creation
│
└─ Day 5: Dashboard
   └─ dashboard.html
      └─ List/Create/Delete boards


WEEK 2: CORE INTEGRATION
├─ Day 1: Load Board from API
│  └─ Modify board.js loadBoardState()
│     └─ Replace localStorage GET with API call
│
├─ Day 2: Save Board to API
│  └─ Modify board.js saveBoardState()
│     └─ Replace localStorage SET with API call
│
├─ Day 3-4: Section Operations
│  └─ Update addSection(), deleteSection()
│     └─ Call API endpoints
│
└─ Day 5: Post-it Operations
   └─ Update createPostit(), updatePostit()
      └─ Call API endpoints


WEEK 3: POLISH & TESTING
├─ Day 1: Loading States
│  └─ Add spinners and indicators
│
├─ Day 2: Error Handling
│  └─ Add error messages and retry logic
│
├─ Day 3: Navigation & Logout
│  └─ Update all links, add logout button
│
├─ Day 4: Testing
│  └─ Test all features end-to-end
│
└─ Day 5: Bug Fixes
   └─ Fix any issues found
```

---

## 🎯 Task Priorities

### 🔴 Critical (Must Complete First)
```
1. ✅ API Client Wrapper
   └─ Foundation for everything else

2. ✅ Login Page
   └─ Can't use app without auth

3. ✅ Dashboard
   └─ Need to list/open boards

4. ✅ Load Board from API
   └─ Must display existing data

5. ✅ Save Board to API
   └─ Must persist changes
```

### 🟡 High Priority (Complete Next)
```
6. ✅ Section CRUD
   └─ Core functionality

7. ✅ Post-it CRUD
   └─ Core functionality

8. ✅ Error Handling
   └─ User experience

9. ✅ Loading States
   └─ User feedback
```

### 🟢 Medium Priority (Nice to Have)
```
10. ✅ Logout
    └─ User control

11. ✅ User Profile Display
    └─ Personalization

12. ✅ Registration Page
    └─ Can manually create users via API at first
```

---

## 🔄 Data Flow Diagrams

### User Login Flow
```
User enters credentials
    ↓
login.js sends to API
    ↓
POST /api/v1/auth/login
    ↓
Backend validates
    ↓
Returns JWT token
    ↓
Store in localStorage
    ↓
Redirect to dashboard
```

### Board Loading Flow
```
User clicks "Open Board"
    ↓
Navigate to board.html?id=123
    ↓
board.js loads
    ↓
GET /api/v1/boards/123
    ↓
Backend returns board data
    ↓
Render sections
    ↓
Render post-its
    ↓
Show board
```

### Board Saving Flow
```
User makes change (drag, edit, etc.)
    ↓
saveBoardState() called
    ↓
Wait 1 second (debounce)
    ↓
PUT /api/v1/boards/123
    ↓
Backend saves to database
    ↓
Show "Saved" indicator
```

### Create Post-it Flow
```
User clicks on section
    ↓
createPostit() called
    ↓
POST /api/v1/boards/123/postits
    ↓
Backend creates in database
    ↓
Returns new post-it with ID
    ↓
Add to UI with server ID
    ↓
User can now edit
```

---

## 📝 Code Change Summary

### Files to CREATE (New)
```
frontend/
├── login.html              ← NEW
├── register.html           ← NEW
├── dashboard.html          ← NEW
└── assets/
    ├── css/
    │   └── auth.css        ← NEW
    └── js/
        ├── api-client.js   ← NEW ⭐
        ├── login.js        ← NEW
        ├── register.js     ← NEW
        └── dashboard.js    ← NEW
```

### Files to MODIFY (Existing)
```
frontend/
├── board.html              ← MODIFY (add auth check)
├── index.html              ← MODIFY (update links)
└── assets/
    └── js/
        └── board.js        ← MODIFY (replace localStorage with API)
```

---

## 🔧 Key Functions to Modify

### board.js - Main Changes

**Function: loadBoardState()**
```
BEFORE:
const saved = localStorage.getItem('vimplBoardState');
const data = JSON.parse(saved);

AFTER:
const board = await apiClient.getBoard(boardId);
// Use board.sections, board.postits, etc.
```

**Function: saveBoardState()**
```
BEFORE:
localStorage.setItem('vimplBoardState', JSON.stringify(data));

AFTER:
await apiClient.updateBoard(boardId, data);
```

**Function: addSection()**
```
BEFORE:
sections.push(newSection);
saveBoardState();

AFTER:
const section = await apiClient.createSection(boardId, sectionData);
addSectionToUI(section);
```

**Function: createPostit()**
```
BEFORE:
postits.push(newPostit);
saveBoardState();

AFTER:
const postit = await apiClient.createPostit(boardId, postitData);
addPostitToUI(postit);
```

---

## 🎨 UI Changes Needed

### New Pages Layout

**Login Page:**
```
┌─────────────────────────┐
│    Welcome to vimpl     │
│                         │
│  ┌───────────────────┐ │
│  │ Email             │ │
│  └───────────────────┘ │
│  ┌───────────────────┐ │
│  │ Password          │ │
│  └───────────────────┘ │
│  ┌───────────────────┐ │
│  │     Log in        │ │
│  └───────────────────┘ │
│         or            │
│  ┌───────────────────┐ │
│  │ Sign in with Google│ │
│  └───────────────────┘ │
└─────────────────────────┘
```

**Dashboard:**
```
┌──────────────────────────────────────┐
│ vimpl    [+ New Board]    [User ▼]  │
├──────────────────────────────────────┤
│ My Boards                            │
│                                      │
│ ┌────────┐ ┌────────┐ ┌────────┐  │
│ │  Q1    │ │  Risk  │ │ Tasks  │  │
│ │ Plan   │ │ Matrix │ │        │  │
│ └────────┘ └────────┘ └────────┘  │
└──────────────────────────────────────┘
```

**Modified Board Page:**
```
┌──────────────────────────────────────┐
│ ← Dashboard  Board Name   💾 Saved   │ ← NEW: Save indicator
├──────────────────────────────────────┤
│                                      │
│  [Grid with sections and post-its]  │
│                                      │
└──────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Phase 1 Testing (Week 1)
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Dashboard shows after login
- [ ] Can create new board
- [ ] New board opens in board.html

### Phase 2 Testing (Week 2)
- [ ] Board loads from API
- [ ] Sections appear correctly
- [ ] Post-its appear correctly
- [ ] Changes auto-save
- [ ] Can create new section
- [ ] Can create new post-it
- [ ] Can delete section
- [ ] Can delete post-it

### Phase 3 Testing (Week 3)
- [ ] Loading spinner shows
- [ ] Save indicator works
- [ ] Errors show messages
- [ ] Logout button works
- [ ] All browsers work
- [ ] Mobile responsive

---

## 💻 Example API Calls

### Authentication
```javascript
// Login
POST http://localhost:3001/api/v1/auth/login
Body: { "email": "user@example.com", "password": "Pass123" }
Returns: { "accessToken": "eyJhbG...", "user": {...} }

// Get current user
GET http://localhost:3001/api/v1/auth/me
Headers: { "Authorization": "Bearer eyJhbG..." }
Returns: { "user": {...} }
```

### Boards
```javascript
// List boards
GET http://localhost:3001/api/v1/boards
Headers: { "Authorization": "Bearer eyJhbG..." }
Returns: { "boards": [{...}, {...}] }

// Get board
GET http://localhost:3001/api/v1/boards/abc-123
Headers: { "Authorization": "Bearer eyJhbG..." }
Returns: { "board": {..., "sections": [...], "postits": [...]} }

// Update board
PUT http://localhost:3001/api/v1/boards/abc-123
Headers: { "Authorization": "Bearer eyJhbG..." }
Body: { "gridData": {...}, "settings": {...} }
Returns: { "board": {...} }
```

### Sections
```javascript
// Create section
POST http://localhost:3001/api/v1/boards/abc-123/sections
Headers: { "Authorization": "Bearer eyJhbG..." }
Body: { "type": "matrix", "title": "Risk Matrix", ... }
Returns: { "section": {...} }

// Update section
PUT http://localhost:3001/api/v1/boards/abc-123/sections/xyz-789
Headers: { "Authorization": "Bearer eyJhbG..." }
Body: { "title": "Updated Title", "isLocked": true }
Returns: { "section": {...} }
```

### Post-its
```javascript
// Create post-it
POST http://localhost:3001/api/v1/boards/abc-123/postits
Headers: { "Authorization": "Bearer eyJhbG..." }
Body: { "sectionId": "xyz", "color": "yellow", "content": "Task 1" }
Returns: { "postit": {...} }

// Update post-it
PUT http://localhost:3001/api/v1/boards/abc-123/postits/post-456
Headers: { "Authorization": "Bearer eyJhbG..." }
Body: { "content": "Updated task", "status": "done" }
Returns: { "postit": {...} }
```

---

## 🚀 Quick Start Commands

### Start Development
```bash
# Terminal 1: Backend
cd vimpl-saas/backend
npm run dev

# Terminal 2: Frontend
cd vimpl-saas/frontend
python3 -m http.server 8000

# Open browser:
http://localhost:8000/login.html
```

### Test API
```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

---

## 📚 Resources

**API Documentation:**
- backend/README.md - Full API reference
- backend/QUICK_REFERENCE.md - Command cheat sheet

**Integration Help:**
- INTEGRATION_TASKS.md - Detailed task list (this file)
- frontend/README.md - Frontend overview

**Testing:**
- backend/test-api.sh - Automated API tests
- Use browser DevTools Network tab

---

**Ready to start?** Begin with **Task 1.1: API Client Wrapper**

This is the foundation for everything else!
