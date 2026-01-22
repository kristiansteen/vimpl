/**
 * vimpl API Client
 * 
 * Handles all communication with the backend API including:
 * - Authentication (login, register, logout, token refresh)
 * - Board operations (CRUD)
 * - Section operations (CRUD)
 * - Post-it operations (CRUD)
 * - Token management and automatic refresh
 * 
 * Supports both Mock Mode (local storage) and Real Backend (API).
 */

const USE_MOCK = false; // Set to FALSE for production (Render), TRUE for demo/dev

// Mock Backend Implementation (unchanged for fallback/demo)
class MockBackend {
    constructor() {
        this.latency = 600;
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem('vimpl_users')) localStorage.setItem('vimpl_users', JSON.stringify([]));
        if (!localStorage.getItem('vimpl_boards')) localStorage.setItem('vimpl_boards', JSON.stringify([]));
        if (!localStorage.getItem('vimpl_sections')) localStorage.setItem('vimpl_sections', JSON.stringify([]));
        if (!localStorage.getItem('vimpl_postits')) localStorage.setItem('vimpl_postits', JSON.stringify([]));
    }

    delay() {
        return new Promise(resolve => setTimeout(resolve, this.latency));
    }

    getData(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    setData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    generateId(prefix = 'id') {
        return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateToken(user) {
        return btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 }));
    }

    // --- Mock Routes ---
    async register(email, password, name) {
        await this.delay();
        const users = this.getData('vimpl_users');
        if (users.find(u => u.email === email)) throw { status: 400, message: 'User already exists' };
        const newUser = { id: this.generateId('user'), email, password, name, createdAt: new Date().toISOString() };
        users.push(newUser);
        this.setData('vimpl_users', users);
        const { password: _, ...userWithoutPassword } = newUser;
        return { user: userWithoutPassword, accessToken: this.generateToken(newUser) };
    }

    async login(email, password) {
        await this.delay();
        const users = this.getData('vimpl_users');
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) throw { status: 401, message: 'Invalid credentials' };
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, accessToken: this.generateToken(user) };
    }

    async getCurrentUser(token) {
        await this.delay();
        try {
            const payload = JSON.parse(atob(token));
            const users = this.getData('vimpl_users');
            const user = users.find(u => u.id === payload.id);
            if (!user) throw new Error('User not found');
            const { password: _, ...userWithoutPassword } = user;
            return { user: userWithoutPassword };
        } catch (e) { throw { status: 401, message: 'Invalid token' }; }
    }

    async getBoards(userId) {
        await this.delay();
        const boards = this.getData('vimpl_boards');
        return { boards: boards.filter(b => b.userId === userId) };
    }

    async createBoard(userId, { title, description, gridData }) {
        await this.delay();
        const newBoard = { id: this.generateId('board'), userId, title, description, gridData: gridData || {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const boards = this.getData('vimpl_boards');
        boards.push(newBoard);
        this.setData('vimpl_boards', boards);
        return { board: newBoard };
    }

    async getBoard(boardId) {
        await this.delay();
        const boards = this.getData('vimpl_boards');
        const board = boards.find(b => b.id === boardId);
        if (!board) throw { status: 404, message: 'Board not found' };
        const sections = this.getData('vimpl_sections').filter(s => s.boardId === boardId);
        const postits = this.getData('vimpl_postits').filter(p => p.boardId === boardId);
        return { board: { ...board, sections, postits } };
    }

    async updateBoard(boardId, updates) {
        await this.delay();
        const boards = this.getData('vimpl_boards');
        const index = boards.findIndex(b => b.id === boardId);
        if (index === -1) throw { status: 404, message: 'Board not found' };
        boards[index] = { ...boards[index], ...updates, updatedAt: new Date().toISOString() };
        this.setData('vimpl_boards', boards);
        return { board: boards[index] };
    }

    async deleteBoard(boardId) {
        await this.delay();
        let boards = this.getData('vimpl_boards');
        boards = boards.filter(b => b.id !== boardId);
        this.setData('vimpl_boards', boards);
        return { success: true };
    }

    async createSection(boardId, sectionData) {
        await this.delay();
        const newSection = { id: this.generateId('section'), boardId, ...sectionData, createdAt: new Date().toISOString() };
        const sections = this.getData('vimpl_sections');
        sections.push(newSection);
        this.setData('vimpl_sections', sections);
        return { section: newSection };
    }

    async createPostit(boardId, postitData) {
        await this.delay();
        const newPostit = { id: this.generateId('postit'), boardId, ...postitData, createdAt: new Date().toISOString() };
        const postits = this.getData('vimpl_postits');
        postits.push(newPostit);
        this.setData('vimpl_postits', postits);
        return { postit: newPostit };
    }

    async updatePostit(boardId, postitId, data) {
        await this.delay();
        const postits = this.getData('vimpl_postits');
        const index = postits.findIndex(p => p.id === postitId);
        if (index !== -1) {
            postits[index] = { ...postits[index], ...data };
            this.setData('vimpl_postits', postits);
            return { postit: postits[index] };
        }
        return { status: 'ok' };
    }
}


class ApiClient {
    /**
     * @param {string} baseURL - Base URL of the API (production URL)
     */
    constructor(baseURL = 'https://vimpl.onrender.com/api/v1') {
        this.baseURL = baseURL;

        if (USE_MOCK) {
            this.mockBackend = new MockBackend();
            console.warn('%c vimpl Mock Backend Active ', 'background: #222; color: #bada55; padding: 4px; border-radius: 4px;');
        }
    }

    /**
     * Helper to make fetch requests
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new ApiError(data.message || 'Request failed', response.status, data);
            }

            // Update token if present in response (optional, usually login/refresh)
            if (data.accessToken) {
                this.setToken(data.accessToken);
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(error.message || 'Network Error', 500, error);
        }
    }

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    async register(email, password, name) {
        if (USE_MOCK) return this.handleMockRequest(() => this.mockBackend.register(email, password, name));

        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name })
        });
    }

    async login(email, password) {
        if (USE_MOCK) return this.handleMockRequest(() => this.mockBackend.login(email, password));

        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async logout() {
        this.clearToken();
        if (USE_MOCK) return Promise.resolve({ message: 'Logged out' });
        // Optional: call backend logout endpoint if it exists
        return Promise.resolve({ message: 'Logged out' });
    }

    async getCurrentUser() {
        if (USE_MOCK) {
            const token = this.getToken();
            if (!token) throw { status: 401, message: 'No token' };
            return this.handleMockRequest(() => this.mockBackend.getCurrentUser(token));
        }

        return this.request('/auth/me');
    }

    // ============================================
    // BOARD METHODS
    // ============================================

    async getBoards() {
        if (USE_MOCK) {
            const user = await this.getCurrentUser();
            return this.handleMockRequest(() => this.mockBackend.getBoards(user.user?.id || user.id));
        }

        return this.request('/boards');
    }

    async getBoard(boardId) {
        if (USE_MOCK) return this.handleMockRequest(() => this.mockBackend.getBoard(boardId));
        return this.request(`/boards/${boardId}`);
    }

    async createBoard(title, description = '', gridData = null) {
        if (USE_MOCK) {
            const user = await this.getCurrentUser();
            return this.handleMockRequest(() => this.mockBackend.createBoard(user.user?.id || user.id, { title, description, gridData }));
        }

        return this.request('/boards', {
            method: 'POST',
            body: JSON.stringify({ title, description, gridData })
        });
    }

    async updateBoard(boardId, data) {
        if (USE_MOCK) return this.handleMockRequest(() => this.mockBackend.updateBoard(boardId, data));

        return this.request(`/boards/${boardId}`, {
            method: 'PUT', // or PATCH
            body: JSON.stringify(data)
        });
    }

    async deleteBoard(boardId) {
        if (USE_MOCK) return this.handleMockRequest(() => this.mockBackend.deleteBoard(boardId));

        return this.request(`/boards/${boardId}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // SECTION & POSTIT METHODS
    // ============================================

    async createSection(boardId, sectionData) {
        if (USE_MOCK) return this.handleMockRequest(() => this.mockBackend.createSection(boardId, sectionData));

        return this.request(`/boards/${boardId}/sections`, {
            method: 'POST',
            body: JSON.stringify(sectionData)
        });
    }

    async updateSection(boardId, sectionId, data) {
        if (USE_MOCK) return Promise.resolve({ section: { id: sectionId, ...data } });

        return this.request(`/boards/${boardId}/sections/${sectionId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteSection(boardId, sectionId) {
        if (USE_MOCK) return Promise.resolve({ success: true });

        return this.request(`/boards/${boardId}/sections/${sectionId}`, {
            method: 'DELETE'
        });
    }

    async createPostit(boardId, postitData) {
        if (USE_MOCK) return this.handleMockRequest(() => this.mockBackend.createPostit(boardId, postitData));

        return this.request(`/boards/${boardId}/postits`, {
            method: 'POST',
            body: JSON.stringify(postitData)
        });
    }

    async updatePostit(boardId, postitId, data) {
        if (USE_MOCK) return this.handleMockRequest(() => this.mockBackend.updatePostit(boardId, postitId, data));

        return this.request(`/boards/${boardId}/postits/${postitId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deletePostit(boardId, postitId) {
        if (USE_MOCK) return Promise.resolve({ success: true });

        return this.request(`/boards/${boardId}/postits/${postitId}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    async handleMockRequest(requestFn) {
        try {
            const response = await requestFn();
            if (response && response.accessToken) this.setToken(response.accessToken);
            return response;
        } catch (error) {
            console.error('Mock API Error:', error);
            throw new ApiError(error.message || 'Mock Request Failed', error.status || 500, error);
        }
    }

    getToken() { return localStorage.getItem('accessToken'); }
    setToken(token) { localStorage.setItem('accessToken', token); }
    clearToken() { localStorage.removeItem('accessToken'); }
    isAuthenticated() { return !!this.getToken(); }
}

class ApiError extends Error {
    constructor(message, status, data = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, ApiError };
}
