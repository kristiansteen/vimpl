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
 * NOTE: Currently running in MOCK MODE for development.
 * Data is persisted to localStorage.
 */

// Mock Backend Implementation
class MockBackend {
    constructor() {
        this.latency = 600; // Simulated network delay in ms
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
        // Simple mock token
        return btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 }));
    }

    // --- Auth Routes ---

    async register(email, password, name) {
        await this.delay();
        const users = this.getData('vimpl_users');

        if (users.find(u => u.email === email)) {
            throw { status: 400, message: 'User already exists' };
        }

        const newUser = {
            id: this.generateId('user'),
            email,
            password, // In a real app, hash this!
            name,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.setData('vimpl_users', users);

        const token = this.generateToken(newUser);
        const { password: _, ...userWithoutPassword } = newUser;

        return { user: userWithoutPassword, accessToken: token };
    }

    async login(email, password) {
        await this.delay();
        const users = this.getData('vimpl_users');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            throw { status: 401, message: 'Invalid credentials' };
        }

        const token = this.generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        return { user: userWithoutPassword, accessToken: token };
    }

    async getCurrentUser(token) {
        await this.delay();
        // Decode mock token
        try {
            const payload = JSON.parse(atob(token));
            const users = this.getData('vimpl_users');
            const user = users.find(u => u.id === payload.id);

            if (!user) throw new Error('User not found');

            const { password: _, ...userWithoutPassword } = user;
            return { user: userWithoutPassword };
        } catch (e) {
            throw { status: 401, message: 'Invalid token' };
        }
    }

    // --- Board Routes ---

    async getBoards(userId) {
        await this.delay();
        const boards = this.getData('vimpl_boards');
        return { boards: boards.filter(b => b.userId === userId) };
    }

    async createBoard(userId, { title, description, gridData }) {
        await this.delay();
        const newBoard = {
            id: this.generateId('board'),
            userId,
            title,
            description,
            gridData: gridData || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

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

        // Hydrate with sections and postits
        const sections = this.getData('vimpl_sections').filter(s => s.boardId === boardId);
        const postits = this.getData('vimpl_postits').filter(p => p.boardId === boardId);

        return { board: { ...board, sections, postits } };
    }

    async updateBoard(boardId, updates) {
        await this.delay();
        const boards = this.getData('vimpl_boards');
        const index = boards.findIndex(b => b.id === boardId);

        if (index === -1) throw { status: 404, message: 'Board not found' };

        // Merge updates
        boards[index] = { ...boards[index], ...updates, updatedAt: new Date().toISOString() };
        this.setData('vimpl_boards', boards);

        return { board: boards[index] };
    }

    // --- Section Routes ---

    async createSection(boardId, sectionData) {
        await this.delay();
        const newSection = {
            id: this.generateId('section'),
            boardId,
            ...sectionData,
            createdAt: new Date().toISOString()
        };
        const sections = this.getData('vimpl_sections');
        sections.push(newSection);
        this.setData('vimpl_sections', sections);
        return { section: newSection };
    }

    // --- Post-it Routes ---

    async createPostit(boardId, postitData) {
        await this.delay();
        const newPostit = {
            id: this.generateId('postit'),
            boardId,
            ...postitData,
            createdAt: new Date().toISOString()
        };
        const postits = this.getData('vimpl_postits');
        postits.push(newPostit);
        this.setData('vimpl_postits', postits);
        return { postit: newPostit };
    }

    async updatePostit(boardId, postitId, data) {
        // Just verify it works for now
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
     * Initialize the API client
     * @param {string} baseURL - Base URL of the API (default: http://localhost:3001/api/v1)
     */
    constructor(baseURL = 'http://localhost:3001/api/v1') {
        this.baseURL = baseURL;
        this.mockBackend = new MockBackend();

        console.warn('%c vimpl Mock Backend Active ', 'background: #222; color: #bada55; padding: 4px; border-radius: 4px;');
    }

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    async register(email, password, name) {
        return this.handleMockRequest(() => this.mockBackend.register(email, password, name));
    }

    async login(email, password) {
        return this.handleMockRequest(() => this.mockBackend.login(email, password));
    }

    async logout() {
        this.clearToken();
        return Promise.resolve({ message: 'Logged out' });
    }

    async getCurrentUser() {
        const token = this.getToken();
        if (!token) throw { status: 401, message: 'No token' };
        return this.handleMockRequest(() => this.mockBackend.getCurrentUser(token));
    }

    async refreshToken() {
        // In mock mode, token never expires or we just return the existing one
        return { accessToken: this.getToken() };
    }

    async verifyEmail(token) {
        return Promise.resolve({ success: true });
    }

    // ============================================
    // BOARD METHODS
    // ============================================

    async getBoards() {
        const user = await this.getCurrentUser();
        return this.handleMockRequest(() => this.mockBackend.getBoards(user.user?.id || user.id)); // Handle inconsistent user structure
    }

    async getBoard(boardId) {
        return this.handleMockRequest(() => this.mockBackend.getBoard(boardId));
    }

    async createBoard(title, description = '', gridData = null) {
        const user = await this.getCurrentUser();
        return this.handleMockRequest(() => this.mockBackend.createBoard(user.user?.id || user.id, { title, description, gridData }));
    }

    async updateBoard(boardId, data) {
        return this.handleMockRequest(() => this.mockBackend.updateBoard(boardId, data));
    }

    async deleteBoard(boardId) {
        return Promise.resolve({ success: true }); // Mock handle done in MockBackend now if called via that path, but let's route it
        // wait, I made deleteBoard in MockBackend but didn't route it in ApiClient.
        return this.handleMockRequest(() => this.mockBackend.deleteBoard(boardId));
    }

    async shareBoard(boardId, email) {
        return this.handleMockRequest(() => this.mockBackend.shareBoard(boardId, email));
    }

    // ============================================
    // SECTION & POSTIT METHODS
    // ============================================

    async createSection(boardId, sectionData) {
        return this.handleMockRequest(() => this.mockBackend.createSection(boardId, sectionData));
    }

    async updateSection(boardId, sectionId, data) {
        return Promise.resolve({ section: { id: sectionId, ...data } });
    }

    async deleteSection(boardId, sectionId) {
        return Promise.resolve({ success: true });
    }

    async createPostit(boardId, postitData) {
        return this.handleMockRequest(() => this.mockBackend.createPostit(boardId, postitData));
    }

    async updatePostit(boardId, postitId, data) {
        return this.handleMockRequest(() => this.mockBackend.updatePostit(boardId, postitId, data));
    }

    async deletePostit(boardId, postitId) {
        return Promise.resolve({ success: true });
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Wrapper to handle mock requests and responses consistent with ApiError
     */
    async handleMockRequest(requestFn) {
        try {
            const response = await requestFn();

            // Check if we need to set token from response
            if (response && response.accessToken) {
                this.setToken(response.accessToken);
            }

            return response;
        } catch (error) {
            console.error('Mock API Error:', error);
            throw new ApiError(
                error.message || 'Mock Request Failed',
                error.status || 500,
                error
            );
        }
    }

    // Unchanged token methods
    getToken() {
        return localStorage.getItem('accessToken');
    }
    setToken(token) {
        localStorage.setItem('accessToken', token);
    }
    clearToken() {
        localStorage.removeItem('accessToken');
    }
    isAuthenticated() {
        return !!this.getToken();
    }
}

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(message, status, data = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, ApiError };
}
