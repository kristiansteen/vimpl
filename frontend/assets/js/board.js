// ========================================
// VIMPL PLANNING BOARD APPLICATION v2
// ========================================

const AppState = {
    grid: null,
    postits: {},
    eventLog: [],
    matrixLog: [],
    teamMembers: [],
    gridSize: 20,
    showGrid: true,
    selectedColor: null,
    currentPostitId: null,
    lockedSections: new Set(),
    autoSaveTimeout: null,
    userId: null,
    isEditMode: false
};

const apiClient = new ApiClient();

// ========================================
// UTILITY FUNCTIONS
// ========================================

function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatTimestamp(date = new Date()) {
    return date.toISOString().replace('T', ' ').substr(0, 19);
}

function logEvent(type, elementId, elementType, details) {
    const event = {
        timestamp: formatTimestamp(),
        type,
        elementId,
        elementType,
        details: typeof details === 'object' ? JSON.stringify(details) : details
    };
    AppState.eventLog.unshift(event);
    if (AppState.eventLog.length > 500) AppState.eventLog.pop();
    scheduleAutoSave();
}

function logMatrixPosition(postitId, sectionId, xLabel, xValue, yLabel, yValue, score) {
    const entry = {
        timestamp: formatTimestamp(),
        postitId,
        sectionId,
        xLabel,
        xValue: Math.round(xValue),
        yLabel,
        yValue: Math.round(yValue),
        score
    };
    AppState.matrixLog.unshift(entry);
    if (AppState.matrixLog.length > 500) AppState.matrixLog.pop();
}

function snapToGrid(value) {
    return Math.round(value / AppState.gridSize) * AppState.gridSize;
}

function getPostitColor(colorName) {
    const colors = {
        yellow: 'var(--postit-yellow)',
        pink: 'var(--postit-pink)',
        blue: 'var(--postit-blue)',
        green: 'var(--postit-green)',
        orange: 'var(--postit-orange)'
    };
    return colors[colorName] || colors.yellow;
}

// ========================================
// AUTO-SAVE FUNCTIONALITY
// ========================================

let currentBoardId = null;
let currentUserRole = 'member'; // Default to restricted

function getBoardIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ========================================
// AUTO-SAVE FUNCTIONALITY
// ========================================

function scheduleAutoSave() {
    clearTimeout(AppState.autoSaveTimeout);
    showAutoSaveStatus('saving');
    AppState.autoSaveTimeout = setTimeout(async () => {
        const success = await saveBoardState();
        if (success) {
            showAutoSaveStatus('saved');
        } else {
            showAutoSaveStatus('error');
        }
    }, 1500); // Slightly longer delay to batch rapid changes
}

function showAutoSaveStatus(status) {
    const indicator = document.getElementById('autosaveIndicator');
    if (!indicator) return;
    const text = indicator.querySelector('.autosave-text');
    indicator.className = 'autosave-indicator ' + status;

    if (status === 'saving') {
        text.textContent = 'Saving changes...';
    } else if (status === 'saved') {
        text.textContent = 'All changes saved';
        // Auto-hide success message after 3 seconds, but keep it if it's "saved"
    } else if (status === 'error') {
        text.textContent = 'Save failed! Retrying...';
        // If error, try saving again after 5 seconds
        if (!AppState.retryTimeout) {
            AppState.retryTimeout = setTimeout(() => {
                AppState.retryTimeout = null;
                scheduleAutoSave();
            }, 5000);
        }
    }
}

async function saveBoardState() {
    if (!currentBoardId) return false;

    try {
        const gridData = AppState.grid.save(true);

        // Save section content
        const sectionContent = {};
        document.querySelectorAll('.grid-stack-item').forEach(item => {
            const id = item.getAttribute('gs-id');
            const textarea = item.querySelector('.text-content');
            if (textarea) {
                sectionContent[id] = { text: textarea.value };
            }
            const title = item.querySelector('.section-title');
            if (title) {
                sectionContent[id] = sectionContent[id] || {};
                sectionContent[id].title = title.value;
            }

            // Save Matrix Labels
            const xLabel = item.querySelector('.x-axis-label');
            const yLabel = item.querySelector('.y-axis-label');
            if (xLabel || yLabel) {
                sectionContent[id] = sectionContent[id] || {};
                if (xLabel) sectionContent[id].xLabel = xLabel.value;
                if (yLabel) sectionContent[id].yLabel = yLabel.value;
            }
        });

        // Get project title
        const projectTitle = document.getElementById('projectTitle')?.value || 'Project name';
        updateTeamMembersFromTable();

        const state = {
            grid: gridData,
            postits: AppState.postits,
            eventLog: AppState.eventLog.slice(0, 100),
            matrixLog: AppState.matrixLog.slice(0, 100),
            lockedSections: Array.from(AppState.lockedSections),
            sectionContent,
            projectTitle,
            teamMembers: AppState.teamMembers,
            userId: AppState.userId,
            version: 2
        };

        // Persist to backend via gridData field
        await apiClient.updateBoard(currentBoardId, {
            title: projectTitle,
            gridData: state
        });

        return true;
    } catch (e) {
        console.error('Save error:', e);
        showAutoSaveStatus('error');
        return false;
    }
}

async function loadBoardState() {
    const boardId = getBoardIdFromUrl();
    if (!boardId) {
        // Handle new board creation flow if needed, or redirect
        if (window.location.search.includes('new=true')) {
            // Let logic proceed to createDefaultBoard later if not finding ID
            return false;
        }
        alert('No board ID specified');
        window.location.href = 'dashboard.html';
        return false;
    }
    currentBoardId = boardId;

    try {
        const response = await apiClient.getBoard(boardId);
        const board = response.board;
        const currentUser = await apiClient.getCurrentUser();
        const userId = currentUser.user?.id || currentUser.id;

        // Determine Role
        if (board.userId === userId) {
            currentUserRole = 'admin';
        } else {
            // Check collaborators
            const collaborator = board.collaborators?.find(c => c.userId === userId);
            if (collaborator) {
                currentUserRole = 'member'; // Enforce member restrictions
            } else {
                alert("You don't have permission to access this board.");
                window.location.href = 'dashboard.html';
                return false;
            }
        }

        // Apply Role UI
        applyRoleRestrictions();

        // Sync Project Title from DB
        if (board.title) {
            const titleInput = document.getElementById('projectTitle');
            if (titleInput) titleInput.value = board.title;
        }

        // Load State
        const state = board.gridData;
        if (!state || Object.keys(state).length === 0) {
            // New empty board or legacy one without data
            return false; // Triggers createDefaultBoard in init
        }

        AppState.grid.load(state.grid || []); // Handle empty grid
        AppState.postits = state.postits || {};
        AppState.eventLog = state.eventLog || [];
        AppState.matrixLog = state.matrixLog || [];
        AppState.lockedSections = new Set(state.lockedSections || []);
        AppState.teamMembers = state.teamMembers || [];

        // Restore project title
        if (state.projectTitle) {
            document.getElementById('projectTitle').value = state.projectTitle;
        }

        // Restore section content after a delay
        setTimeout(() => {
            if (state.sectionContent) {
                Object.keys(state.sectionContent).forEach(id => {
                    const item = document.querySelector(`[gs-id="${id}"]`);
                    if (item && state.sectionContent[id]) {
                        const textarea = item.querySelector('.text-content');
                        if (textarea && state.sectionContent[id].text) {
                            textarea.value = state.sectionContent[id].text;
                        }
                        const title = item.querySelector('.section-title');
                        if (title && state.sectionContent[id].title) {
                            title.value = state.sectionContent[id].title;
                        }

                        // Restore Matrix Labels
                        const xLabel = item.querySelector('.x-axis-label');
                        const yLabel = item.querySelector('.y-axis-label');
                        if (xLabel && state.sectionContent[id].xLabel) {
                            xLabel.value = state.sectionContent[id].xLabel;
                        }
                        if (yLabel && state.sectionContent[id].yLabel) {
                            yLabel.value = state.sectionContent[id].yLabel;
                        }
                    }
                });
            }

            // Restore team members table
            if (state.teamMembers && state.teamMembers.length > 0) {
                const tbody = document.querySelector('.team-members-body');
                if (tbody) {
                    tbody.querySelectorAll('.team-member-row').forEach(row => row.remove());
                    const addRow = tbody.querySelector('.add-team-row');
                    state.teamMembers.forEach(member => {
                        const row = document.createElement('tr');
                        row.className = 'team-member-row';
                        row.setAttribute('data-member-id', member.id || 'member_' + Date.now());
                        row.innerHTML = `
                                    <td><input type="text" class="team-name" placeholder="Name" value="${member.name || ''}" /></td>
                                    <td><input type="email" class="team-email" placeholder="email@example.com" value="${member.email || ''}" /></td>
                                    <td><button class="section-btn team-delete-btn"><i class="fas fa-times"></i></button></td>
                                `;
                        tbody.insertBefore(row, addRow);
                    });
                }
            }

            // Restore post-its
            Object.values(AppState.postits).forEach(postitData => {
                const section = document.querySelector(`[gs-id="${postitData.section}"]`);
                if (section) {
                    const dropzone = section.querySelector('.postit-dropzone');
                    if (dropzone) {
                        restorePostit(postitData, dropzone);
                    }
                }
            });

            // Restore locked sections
            AppState.lockedSections.forEach(id => {
                updateSectionLockUI(id, true);
            });

            initializeDropzones();
            attachSectionEventListeners();
            updateAllOwnerDropdowns();
            fixLegacyKPISections();
        }, 300);

        return true;
    } catch (e) {
        console.error('Load error:', e);
        // Fallback or error handling
        return false;
    }
}

function applyRoleRestrictions() {
    if (currentUserRole === 'member') {
        console.log('Applying Member Restrictions');
        // Disable Grid Editing via GridStack API
        // We wait for grid init if not ready, but this is called before load?
        // Actually grid is init'd at bottom.

        // Hide sidebar structure buttons
        document.getElementById('addSection').style.display = 'none';
        document.getElementById('toggleGrid').style.display = 'none';
        document.getElementById('newBoard').style.display = 'none';

        // Disable project title editing
        const titleInput = document.getElementById('projectTitle');
        if (titleInput) titleInput.disabled = true;

        // Note: Specific section lock/delete buttons are handled by CSS or event delegation check
        document.body.classList.add('role-member');
    }
}

function fixLegacyKPISections() {
    document.querySelectorAll('.section-kpi').forEach(section => {
        // Remove old bottom button
        const oldBtn = section.querySelector('.kpi-add');
        if (oldBtn) {
            oldBtn.remove();
        }

        // Add new header button if missing
        const headerRight = section.querySelector('.section-header-right');
        if (headerRight && !headerRight.querySelector('.add-kpi-btn')) {
            const addBtn = document.createElement('button');
            addBtn.className = 'section-btn add-kpi-btn';
            addBtn.title = 'Add KPI';
            addBtn.innerHTML = '<i class="fas fa-plus"></i>';

            // Insert before other buttons
            headerRight.insertBefore(addBtn, headerRight.firstChild);

            // Re-attach event listener for this new button
            addBtn.onclick = function () {
                const sectionContent = this.closest('.grid-stack-item-content');
                const container = sectionContent.querySelector('.kpi-container');
                const item = document.createElement('div');
                item.className = 'kpi-item';
                item.innerHTML = `
                        <div class="kpi-indicator green" data-status="green" onclick="cycleKPIStatus(this)"></div>
                        <input type="text" value="New KPI" />
                        <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
                    `;
                container.appendChild(item);
                item.querySelector('.kpi-delete-btn').onclick = function () { item.remove(); scheduleAutoSave(); };
                scheduleAutoSave();
            };
        }
    });
}

function restorePostit(data, parentElement) {
    const postit = document.createElement('div');
    postit.className = 'postit' + (data.status === 'done' ? ' done' : '');
    postit.id = data.id;
    postit.style.backgroundColor = getPostitColor(data.color);
    postit.style.left = data.x + 'px';
    postit.style.top = data.y + 'px';
    postit.setAttribute('data-color', data.color);

    postit.innerHTML = `
                <div class="postit-handle" title="Drag to move"></div>
                <div class="postit-inner">
                    <div class="postit-front">
                        <textarea placeholder="...">${data.content || ''}</textarea>
                    </div>
                </div>
                <button class="postit-delete">&times;</button>
            `;

    parentElement.appendChild(postit);
    makePostitDraggable(postit);
    attachPostitEvents(postit);
}

// ========================================
// SECTION TEMPLATES
// ========================================

function createSectionHeader(title, showLock = true, extraButtons = '') {
    return `
                <div class="section-header">
                    <input type="text" class="section-title" value="${title}" />
                    <div class="section-controls">
                        ${extraButtons}
                        ${showLock ? '<button class="section-btn lock-btn" title="Lock Section"><i class="fas fa-unlock"></i></button>' : ''}
                        <button class="section-btn delete-section-btn" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
}

function createTextSection(title = 'New Section') {
    return `
                ${createSectionHeader(title)}
                <div class="section-content postit-dropzone">
                    <textarea class="text-content" placeholder="Enter text here..."></textarea>
                </div>
            `;
}

function createTeamSection(title = 'Team') {
    return `
                ${createSectionHeader(title)}
                <div class="section-content">
                    <table class="team-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody class="team-members-body">
                            <tr class="team-member-row" data-member-id="member_1">
                                <td><input type="text" class="team-name" placeholder="Name" value="" /></td>
                                <td><input type="email" class="team-email" placeholder="email@example.com" value="" /></td>
                                <td><button class="section-btn team-delete-btn"><i class="fas fa-times"></i></button></td>
                            </tr>
                            <tr class="add-team-row">
                                <td colspan="3"><i class="fas fa-plus"></i> Add Team Member</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
}

function createKPISection(title = 'Project KPIs') {
    const extraBtns = `<button class="section-btn add-kpi-btn" title="Add KPI"><i class="fas fa-plus"></i></button>`;
    return `
                ${createSectionHeader(title, true, extraBtns)}
                <div class="section-content">
                    <div class="kpi-container">
                        <div class="kpi-item">
                            <div class="kpi-indicator green" data-status="green" onclick="cycleKPIStatus(this)"></div>
                            <input type="text" value="Cost" />
                            <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="kpi-item">
                            <div class="kpi-indicator green" data-status="green" onclick="cycleKPIStatus(this)"></div>
                            <input type="text" value="Quality" />
                            <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="kpi-item">
                            <div class="kpi-indicator green" data-status="green" onclick="cycleKPIStatus(this)"></div>
                            <input type="text" value="Time" />
                            <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                </div>
            `;
}

function createMatrixSection(title = 'Risk Matrix', xLabel = 'Probability', yLabel = 'Consequence') {
    const id = generateId('matrix');
    return `
                ${createSectionHeader(title)}
                <div class="section-content matrix-section" data-matrix-id="${id}" data-x-label="${xLabel}" data-y-label="${yLabel}">
                    <div class="matrix-container">
                        <div class="matrix-y-label">
                            <input type="text" value="${yLabel} →" class="y-axis-label" />
                        </div>
                        <div class="matrix-grid postit-dropzone matrix-dropzone" data-matrix-id="${id}">
                            <div class="matrix-quadrant postit-dropzone"></div>
                            <div class="matrix-quadrant postit-dropzone"></div>
                            <div class="matrix-quadrant postit-dropzone"></div>
                            <div class="matrix-quadrant postit-dropzone"></div>
                        </div>
                        <div class="matrix-x-label">
                            <input type="text" value="${xLabel} →" class="x-axis-label" />
                        </div>
                    </div>
                </div>
            `;
}

function createWeekPlanSection(title = 'Week Plan', numWeeks = 12, numTracks = 5) {
    const today = new Date().toISOString().split('T')[0];

    let weeksHtml = '';
    for (let i = 0; i < numWeeks; i++) {
        let cellsHtml = '';
        for (let t = 0; t < numTracks; t++) {
            cellsHtml += `<div class="week-cell postit-dropzone"></div>`;
        }
        weeksHtml += `
                    <div class="week-column" data-week-index="${i}">
                        <div class="week-header">Week ${i + 1}</div>
                        ${cellsHtml}
                    </div>
                `;
    }

    let tracksHtml = '';
    for (let i = 1; i <= numTracks; i++) {
        tracksHtml += `
                    <div class="track-item">
                        <input type="text" value="Track ${i}" />
                    </div>
                `;
    }

    const extraBtns = `
                <button class="section-btn add-week-btn" title="Add Week"><i class="fas fa-plus"></i></button>
                <button class="section-btn add-track-btn" title="Add Track"><i class="fas fa-layer-group"></i></button>
                <button class="section-btn calendar-btn" title="Calendar Settings"><i class="fas fa-calendar-alt"></i></button>
            `;

    return `
                ${createSectionHeader(title, true, extraBtns)}
                <div class="section-content" style="padding: 0; display: flex; flex-direction: column;">
                    <div class="week-planner-wrapper">
                        <div class="week-planner-settings">
                            <label>Start Date:</label>
                            <input type="date" class="week-start-date" value="${today}" onchange="updateWeekNumbers(this)" />
                        </div>
                        <div class="week-planner">
                            <div class="track-column">
                                <div class="track-header">Track</div>
                                ${tracksHtml}
                            </div>
                            <div class="weeks-container">
                                ${weeksHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
}

function createActionsSection(title = 'Actions') {
    return `
                ${createSectionHeader(title)}
                <div class="section-content">
                    <table class="actions-table">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>When</th>
                                <th>Who</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="text" placeholder="Enter action..." /></td>
                                <td><input type="date" /></td>
                                <td><select class="action-owner-select"><option value="">-- Select --</option></select></td>
                                <td>
                                    <select>
                                        <option value="todo">To Do</option>
                                        <option value="inprogress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </td>
                            </tr>
                            <tr class="add-row">
                                <td colspan="4"><i class="fas fa-plus"></i> Add Action</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
}

function createPostitAreaSection(title = 'Ideas') {
    return `
                ${createSectionHeader(title)}
                <div class="section-content postit-dropzone" style="min-height: 200px;"></div>
            `;
}

function createKanbanSection(title = 'Kanban Board') {
    const extraBtns = `<button class="section-btn add-column-btn" title="Add Column"><i class="fas fa-plus"></i></button>`;
    return `
                ${createSectionHeader(title, true, extraBtns)}
                <div class="section-content">
                    <div class="kanban-container">
                        <div class="kanban-column todo">
                            <div class="kanban-column-header">📋 To Do</div>
                            <div class="kanban-dropzone postit-dropzone"></div>
                        </div>
                        <div class="kanban-column inprogress">
                            <div class="kanban-column-header">⚡ In Progress</div>
                            <div class="kanban-dropzone postit-dropzone"></div>
                        </div>
                        <div class="kanban-column done">
                            <div class="kanban-column-header">✅ Done</div>
                            <div class="kanban-dropzone postit-dropzone"></div>
                        </div>
                    </div>
                </div>
            `;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function updateWeekNumbers(input) {
    const startDate = new Date(input.value);
    const section = input.closest('.grid-stack-item-content');
    const weekColumns = section.querySelectorAll('.week-column');

    weekColumns.forEach((col, index) => {
        const weekDate = new Date(startDate);
        weekDate.setDate(weekDate.getDate() + (index * 7));
        const weekNum = getWeekNumber(weekDate);
        col.querySelector('.week-header').textContent = `W${weekNum}`;

        // Highlight current week
        const now = new Date();
        const currentWeekNum = getWeekNumber(now);
        col.classList.toggle('current', weekNum === currentWeekNum && weekDate.getFullYear() === now.getFullYear());
    });

    scheduleAutoSave();
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function cycleKPIStatus(indicator) {
    const statuses = ['green', 'yellow', 'red'];
    const current = indicator.getAttribute('data-status');
    const nextIndex = (statuses.indexOf(current) + 1) % 3;
    const next = statuses[nextIndex];

    indicator.setAttribute('data-status', next);
    indicator.className = 'kpi-indicator ' + next;
    scheduleAutoSave();
}

// ========================================
// COLUMN/CELL CONTEXT HELPERS
// ========================================

function getColumnContext(element) {
    // Get context information about where a post-it is located
    const context = {
        type: 'unknown',
        details: {}
    };

    // Check if in Kanban column
    const kanbanColumn = element.closest('.kanban-column');
    if (kanbanColumn) {
        context.type = 'kanban';
        if (kanbanColumn.classList.contains('todo')) {
            context.details.column = 'To Do';
        } else if (kanbanColumn.classList.contains('inprogress')) {
            context.details.column = 'In Progress';
        } else if (kanbanColumn.classList.contains('done')) {
            context.details.column = 'Done';
        }
        return context;
    }

    // Check if in Week Planner cell
    const weekCell = element.closest('.week-cell');
    if (weekCell) {
        context.type = 'weekplan';
        const weekColumn = weekCell.closest('.week-column');
        const weekIndex = weekColumn?.getAttribute('data-week-index');
        const weekHeader = weekColumn?.querySelector('.week-header')?.textContent;

        // Find track index
        const trackColumn = weekCell.closest('.week-planner-wrapper')?.querySelector('.track-column');
        const allCells = Array.from(weekCell.parentElement.children);
        const cellIndex = allCells.indexOf(weekCell);
        const trackItems = trackColumn?.querySelectorAll('.track-item');
        const trackName = trackItems?.[cellIndex]?.querySelector('input')?.value || `Track ${cellIndex + 1}`;

        context.details.week = weekHeader || `Week ${parseInt(weekIndex) + 1}`;
        context.details.track = trackName;
        return context;
    }

    // Check if in Matrix quadrant
    const matrixQuadrant = element.closest('.matrix-quadrant');
    if (matrixQuadrant) {
        context.type = 'matrix';
        const quadrants = Array.from(matrixQuadrant.parentElement.children);
        const quadrantIndex = quadrants.indexOf(matrixQuadrant);
        const quadrantNames = ['High Impact, Low Effort', 'High Impact, High Effort', 'Low Impact, Low Effort', 'Low Impact, High Effort'];
        context.details.quadrant = quadrantNames[quadrantIndex] || `Quadrant ${quadrantIndex + 1}`;

        // Get axis labels
        const matrixSection = element.closest('.matrix-section');
        context.details.xLabel = matrixSection?.querySelector('.x-axis-label')?.value || 'X';
        context.details.yLabel = matrixSection?.querySelector('.y-axis-label')?.value || 'Y';

        return context;
    }

    return context;
}

function getRiskScore(postitId) {
    const data = AppState.postits[postitId];
    if (data && data.isMatrix) {
        return data.xValue * data.yValue;
    }
    return null;
}

// ========================================
// TEAM MEMBERS MANAGEMENT
// ========================================

function updateTeamMembersFromTable() {
    AppState.teamMembers = [];
    document.querySelectorAll('.team-member-row').forEach(row => {
        const name = row.querySelector('.team-name')?.value?.trim();
        const email = row.querySelector('.team-email')?.value?.trim();
        if (name) {
            AppState.teamMembers.push({
                id: row.getAttribute('data-member-id'),
                name,
                email
            });
        }
    });
    updateAllOwnerDropdowns();
    scheduleAutoSave();
}

function updateAllOwnerDropdowns() {
    // Update the post-it form dropdown
    const formOwner = document.getElementById('formOwner');
    if (formOwner) {
        const currentValue = formOwner.value;
        formOwner.innerHTML = '<option value="">-- Select Owner --</option>';
        AppState.teamMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.name;
            option.textContent = member.name + (member.email ? ` (${member.email})` : '');
            formOwner.appendChild(option);
        });
        formOwner.value = currentValue;
    }

    // Update action table dropdowns if any exist
    document.querySelectorAll('.action-owner-select').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Select --</option>';
        AppState.teamMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.name;
            option.textContent = member.name;
            select.appendChild(option);
        });
        select.value = currentValue;
    });
}

function addTeamMemberRow(tbody) {
    const memberId = 'member_' + Date.now();
    const newRow = document.createElement('tr');
    newRow.className = 'team-member-row';
    newRow.setAttribute('data-member-id', memberId);
    newRow.innerHTML = `
                <td><input type="text" class="team-name" placeholder="Name" value="" /></td>
                <td><input type="email" class="team-email" placeholder="email@example.com" value="" /></td>
                <td><button class="section-btn team-delete-btn"><i class="fas fa-times"></i></button></td>
            `;

    // Insert before the add row
    const addRow = tbody.querySelector('.add-team-row');
    tbody.insertBefore(newRow, addRow);

    // Attach events
    attachTeamRowEvents(newRow);

    // Focus on the name field
    newRow.querySelector('.team-name').focus();

    scheduleAutoSave();
}

function attachTeamRowEvents(row) {
    const nameInput = row.querySelector('.team-name');
    const emailInput = row.querySelector('.team-email');
    const deleteBtn = row.querySelector('.team-delete-btn');

    if (nameInput) {
        nameInput.addEventListener('input', updateTeamMembersFromTable);
        nameInput.addEventListener('change', updateTeamMembersFromTable);
    }
    if (emailInput) {
        emailInput.addEventListener('input', updateTeamMembersFromTable);
        emailInput.addEventListener('change', updateTeamMembersFromTable);
    }
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            row.remove();
            updateTeamMembersFromTable();
        });
    }
}

// ========================================
// POST-IT MANAGEMENT
// ========================================

function createPostit(color, x, y, parentElement, data = {}) {
    const id = data.id || generateId('postit');
    const postit = document.createElement('div');
    postit.className = 'postit' + (data.status === 'done' ? ' done' : '');
    postit.id = id;
    postit.style.backgroundColor = getPostitColor(color);
    postit.style.left = snapToGrid(x) + 'px';
    postit.style.top = snapToGrid(y) + 'px';
    postit.setAttribute('data-color', color);

    postit.innerHTML = `
                <div class="postit-handle" title="Drag to move"></div>
                <div class="postit-inner">
                    <div class="postit-front">
                        <textarea placeholder="...">${data.content || ''}</textarea>
                    </div>
                </div>
                <button class="postit-delete">&times;</button>
            `;

    parentElement.appendChild(postit);

    // Determine section type
    const sectionContent = parentElement.closest('.section-content');
    const matrixSection = sectionContent?.classList.contains('matrix-section');
    const weekPlanCell = parentElement.classList.contains('week-cell');

    // Store post-it data
    const postitData = {
        id,
        color,
        x: snapToGrid(x),
        y: snapToGrid(y),
        content: data.content || '',
        owner: data.owner || '',
        status: data.status || 'todo',
        section: parentElement.closest('.grid-stack-item')?.getAttribute('gs-id') || 'unknown',
        isMatrix: matrixSection,
        isWeekPlan: weekPlanCell,
        xValue: data.xValue || 50,
        yValue: data.yValue || 50,
        mitigation: data.mitigation || ''
    };
    AppState.postits[id] = postitData;

    makePostitDraggable(postit);
    attachPostitEvents(postit);

    // Enhanced logging with context
    const columnContext = getColumnContext(parentElement);
    const logDetails = {
        color,
        x: snapToGrid(x),
        y: snapToGrid(y)
    };

    if (columnContext.type === 'kanban') {
        logDetails.kanbanColumn = columnContext.details.column;
    } else if (columnContext.type === 'weekplan') {
        logDetails.week = columnContext.details.week;
        logDetails.track = columnContext.details.track;
    } else if (columnContext.type === 'matrix') {
        logDetails.quadrant = columnContext.details.quadrant;
        logDetails.riskScore = postitData.xValue * postitData.yValue;
        logDetails.xAxis = `${columnContext.details.xLabel}: ${postitData.xValue}`;
        logDetails.yAxis = `${columnContext.details.yLabel}: ${postitData.yValue}`;
    }

    logEvent('create', id, 'postit', logDetails);
    scheduleAutoSave();

    return postit;
}

function attachPostitEvents(postit) {
    const id = postit.id;

    // Delete button
    postit.querySelector('.postit-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deletePostit(id);
    });

    // Content change
    const textarea = postit.querySelector('textarea');
    textarea.addEventListener('input', () => {
        if (AppState.postits[id]) {
            AppState.postits[id].content = textarea.value;
            scheduleAutoSave();
        }
    });

    // Double-click to open form
    postit.addEventListener('dblclick', (e) => {
        if (e.target.tagName !== 'TEXTAREA') {
            openPostitForm(id, e.clientX, e.clientY);
        }
    });
}

function makePostitDraggable(postit) {
    let isDragging = false;
    let startX, startY, origLeft, origTop;

    postit.addEventListener('mousedown', (e) => {
        // Only allow dragging from handle or non-input areas
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;

        // Allow dragging from handle, the postit body, or the inner container
        if (!e.target.classList.contains('postit-handle') &&
            !e.target.classList.contains('postit') &&
            !e.target.closest('.postit-inner')) return;

        isDragging = true;
        postit.classList.add('dragging');
        startX = e.clientX;
        startY = e.clientY;
        origLeft = postit.offsetLeft;
        origTop = postit.offsetTop;
        e.preventDefault();
    });

    const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        postit.style.left = (origLeft + dx) + 'px';
        postit.style.top = (origTop + dy) + 'px';

        // Highlight week cells when dragging over them
        postit.hidden = true; // Briefly hide to detect element below
        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        postit.hidden = false;

        document.querySelectorAll('.week-cell').forEach(c => c.classList.remove('drag-over-active'));
        const cell = elemBelow?.closest('.week-cell');
        if (cell) {
            cell.classList.add('drag-over-active');
        }
    };

    const onMouseUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        postit.classList.remove('dragging');
        document.querySelectorAll('.week-cell').forEach(c => c.classList.remove('drag-over-active'));

        const id = postit.id;

        // SNAP TO CELL LOGIC
        postit.hidden = true;
        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        postit.hidden = false;

        let newParent = elemBelow?.closest('.postit-dropzone');
        // If dropped on another postit, find its parent
        if (!newParent && elemBelow?.closest('.postit')) {
            newParent = elemBelow.closest('.postit').parentElement;
        }

        if (newParent) {
            // Reparent if changed container
            if (newParent !== postit.parentElement) {
                newParent.appendChild(postit);

                // If moving to/from Matrix, update matrix status
                const isMatrix = newParent.classList.contains('matrix-dropzone');
                if (AppState.postits[id]) {
                    AppState.postits[id].isMatrix = isMatrix;
                    AppState.postits[id].isWeekPlan = newParent.classList.contains('week-cell');
                    AppState.postits[id].section = newParent.closest('.grid-stack-item')?.getAttribute('gs-id');
                }
            }

            // Snap logic
            if (newParent.classList.contains('week-cell')) {
                // Center in cell
                postit.style.left = '50%';
                postit.style.top = '50%';
                postit.style.transform = 'translate(-50%, -50%)'; // Use transform for centering
                // Store relative position as 0,0 since we rely on CSS centering for snapping
                // Actually, let's just set explicit pixels to center
                const rect = newParent.getBoundingClientRect();
                const pRect = postit.getBoundingClientRect(); // will be wrong if transformed
                // Simpler: just set left/top to a small margin if it's in a cell
                postit.style.transform = ''; // reset transform
                postit.style.left = '10px';
                postit.style.top = '10px';
            } else {
                // Normal position update relative to new parent
                const rect = newParent.getBoundingClientRect();
                // Calculate position relative to new parent
                // Global mouse pos (e.clientX) - parent offset
                const x = e.clientX - rect.left - 76; // center horizontally (152/2)
                const y = e.clientY - rect.top - 12;  // offset by handle height

                postit.style.left = Math.max(0, x) + 'px';
                postit.style.top = Math.max(0, y) + 'px';
            }
        }

        const newX = parseInt(postit.style.left);
        const newY = parseInt(postit.style.top);

        if (AppState.postits[id]) {
            AppState.postits[id].x = newX;
            AppState.postits[id].y = newY;

            // Update matrix position if in matrix
            const matrixDropzone = postit.closest('.matrix-dropzone');
            if (matrixDropzone) {
                updateMatrixPositionFromDrag(postit, matrixDropzone);
            }
        }

        // Enhanced logging with context
        const columnContext = getColumnContext(postit);
        const logDetails = { x: newX, y: newY };

        if (columnContext.type === 'kanban') {
            logDetails.kanbanColumn = columnContext.details.column;
        } else if (columnContext.type === 'weekplan') {
            logDetails.week = columnContext.details.week;
            logDetails.track = columnContext.details.track;
        } else if (columnContext.type === 'matrix') {
            logDetails.quadrant = columnContext.details.quadrant;
            if (AppState.postits[id]) {
                const data = AppState.postits[id];
                logDetails.riskScore = data.xValue * data.yValue;
                logDetails.xAxis = `${columnContext.details.xLabel}: ${data.xValue}`;
                logDetails.yAxis = `${columnContext.details.yLabel}: ${data.yValue}`;
            }
        }

        logEvent('move', id, 'postit', logDetails);
        scheduleAutoSave();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function deletePostit(id) {
    const postit = document.getElementById(id);
    if (postit) {
        postit.remove();
        delete AppState.postits[id];
        logEvent('delete', id, 'postit', 'Deleted');
        scheduleAutoSave();
    }
}

function updateMatrixPositionFromDrag(postit, matrix) {
    const matrixRect = matrix.getBoundingClientRect();
    const postitRect = postit.getBoundingClientRect();

    const centerX = (postitRect.left + postitRect.width / 2) - matrixRect.left;
    const centerY = (postitRect.top + postitRect.height / 2) - matrixRect.top;

    const xPercent = Math.max(1, Math.min(100, Math.round((centerX / matrixRect.width) * 100)));
    const yPercent = Math.max(1, Math.min(100, Math.round(100 - (centerY / matrixRect.height) * 100)));

    const id = postit.id;
    if (AppState.postits[id]) {
        AppState.postits[id].xValue = xPercent;
        AppState.postits[id].yValue = yPercent;

        const section = matrix.closest('.matrix-section');
        const xLabel = section?.querySelector('.x-axis-label')?.value || 'X';
        const yLabel = section?.querySelector('.y-axis-label')?.value || 'Y';
        const score = xPercent * yPercent;

        logMatrixPosition(id, matrix.getAttribute('data-matrix-id'), xLabel, xPercent, yLabel, yPercent, score);
    }
}

// ========================================
// POST-IT FORM
// ========================================

function openPostitForm(id, clickX, clickY) {
    const data = AppState.postits[id];
    if (!data) return;

    AppState.currentPostitId = id;
    const form = document.getElementById('postitForm');

    // Position form
    const formWidth = 280;
    const formHeight = 400;
    let x = clickX + 10;
    let y = clickY + 10;

    if (x + formWidth > window.innerWidth) x = clickX - formWidth - 10;
    if (y + formHeight > window.innerHeight) y = window.innerHeight - formHeight - 10;

    form.style.left = x + 'px';
    form.style.top = Math.max(10, y) + 'px';
    form.style.display = 'block';

    // Update owner dropdown with current team members
    updateAllOwnerDropdowns();

    // Fill form
    document.getElementById('formContent').value = data.content || '';
    document.getElementById('formOwner').value = data.owner || '';
    document.getElementById('formStatus').value = data.status || 'todo';

    // Show/hide risk fields
    const riskFields = document.getElementById('riskFields');
    if (data.isMatrix) {
        riskFields.style.display = 'block';
        document.getElementById('formXValue').value = data.xValue || 50;
        document.getElementById('formYValue').value = data.yValue || 50;
        document.getElementById('formMitigation').value = data.mitigation || '';
        updateScoreDisplay();

        // Get axis labels
        const postit = document.getElementById(id);
        const section = postit?.closest('.matrix-section');
        if (section) {
            const xLabel = section.querySelector('.x-axis-label')?.value || 'X Value';
            const yLabel = section.querySelector('.y-axis-label')?.value || 'Y Value';
            document.getElementById('xAxisLabel').textContent = xLabel.replace(' →', '') + ' (1-100)';
            document.getElementById('yAxisLabel').textContent = yLabel.replace(' →', '') + ' (1-100)';
        }
    } else {
        riskFields.style.display = 'none';
    }

    // Set form title
    document.getElementById('formTitle').textContent = data.isMatrix ? 'Risk Item' : (data.isWeekPlan ? 'Task' : 'Note');
}

function closePostitForm() {
    document.getElementById('postitForm').style.display = 'none';
    AppState.currentPostitId = null;
}

function savePostitForm() {
    const id = AppState.currentPostitId;
    if (!id || !AppState.postits[id]) return;

    const data = AppState.postits[id];
    data.content = document.getElementById('formContent').value;
    data.owner = document.getElementById('formOwner').value;
    data.status = document.getElementById('formStatus').value;

    if (data.isMatrix) {
        data.xValue = parseInt(document.getElementById('formXValue').value) || 50;
        data.yValue = parseInt(document.getElementById('formYValue').value) || 50;
        data.mitigation = document.getElementById('formMitigation').value;

        // Update postit position in matrix based on values
        updatePostitPositionInMatrix(id);
    }

    // Update postit display
    const postit = document.getElementById(id);
    if (postit) {
        postit.querySelector('textarea').value = data.content;

        // Update done status
        if (data.status === 'done') {
            postit.classList.add('done');
        } else {
            postit.classList.remove('done');
        }
    }

    logEvent('edit', id, 'postit', { status: data.status, owner: data.owner });
    scheduleAutoSave();
}

function updatePostitPositionInMatrix(id) {
    const data = AppState.postits[id];
    const postit = document.getElementById(id);
    if (!postit || !data.isMatrix) return;

    const matrix = postit.closest('.matrix-dropzone');
    if (!matrix) return;

    const matrixRect = matrix.getBoundingClientRect();
    const postitSize = 42;

    // Convert percentage to position
    const x = (data.xValue / 100) * matrixRect.width - postitSize / 2;
    const y = ((100 - data.yValue) / 100) * matrixRect.height - postitSize / 2;

    postit.style.left = Math.max(0, x) + 'px';
    postit.style.top = Math.max(0, y) + 'px';

    data.x = Math.max(0, x);
    data.y = Math.max(0, y);
}

function updateScoreDisplay() {
    const x = parseInt(document.getElementById('formXValue').value) || 0;
    const y = parseInt(document.getElementById('formYValue').value) || 0;
    document.getElementById('scoreDisplay').textContent = x * y;
}

// ========================================
// SECTION LOCKING
// ========================================

function toggleSectionLock(sectionId) {
    const isLocked = AppState.lockedSections.has(sectionId);

    if (isLocked) {
        AppState.lockedSections.delete(sectionId);
    } else {
        AppState.lockedSections.add(sectionId);
    }

    updateSectionLockUI(sectionId, !isLocked);
    updateGridLock();
    scheduleAutoSave();
}

function updateSectionLockUI(sectionId, locked) {
    const item = document.querySelector(`[gs-id="${sectionId}"]`);
    if (!item) return;

    const header = item.querySelector('.section-header');
    const lockBtn = item.querySelector('.lock-btn');

    if (locked) {
        header?.classList.add('locked');
        if (lockBtn) {
            lockBtn.classList.add('locked');
            lockBtn.innerHTML = '<i class="fas fa-lock"></i>';
        }
    } else {
        header?.classList.remove('locked');
        if (lockBtn) {
            lockBtn.classList.remove('locked');
            lockBtn.innerHTML = '<i class="fas fa-unlock"></i>';
        }
    }
}

function updateGridLock() {
    document.querySelectorAll('.grid-stack-item').forEach(item => {
        const id = item.getAttribute('gs-id');
        const locked = AppState.lockedSections.has(id);
        AppState.grid.update(item, { noMove: locked, noResize: locked });
    });
}

// ========================================
// INITIALIZATION
// ========================================

function initializeGrid() {
    const isMember = currentUserRole === 'member';

    AppState.grid = GridStack.init({
        column: 12,
        cellHeight: 80,
        margin: 8,
        float: true,
        animate: true,
        staticGrid: true, // Default to static (view only)
        draggable: { handle: '.section-header' },
        resizable: { handles: 'all' },
        disableOneColumnMode: true
    });

    AppState.grid.on('resizestop dragstop', () => {
        setTimeout(initializeDropzones, 100);
        scheduleAutoSave();
    });

    AppState.grid.on('added', () => {
        setTimeout(() => {
            initializeDropzones();
            attachSectionEventListeners();
        }, 100);
    });
}

function toggleEditMode() {
    AppState.isEditMode = !AppState.isEditMode;

    // Update UI
    const btn = document.getElementById('editLayout');
    if (AppState.isEditMode) {
        document.body.classList.add('edit-mode');
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-check"></i> Done';
        AppState.grid.setStatic(false);
    } else {
        document.body.classList.remove('edit-mode');
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-pen-to-square"></i> Edit Layout';
        AppState.grid.setStatic(true);
        scheduleAutoSave(); // Save layout when finishing edit
    }
}

function initializePostitPalette() {
    document.querySelectorAll('.postit-color').forEach(colorBtn => {
        colorBtn.addEventListener('click', () => {
            const color = colorBtn.getAttribute('data-color');

            document.querySelectorAll('.postit-color').forEach(c => c.classList.remove('selected'));

            if (AppState.selectedColor === color) {
                AppState.selectedColor = null;
                document.body.style.cursor = 'default';
            } else {
                AppState.selectedColor = color;
                colorBtn.classList.add('selected');
                document.body.style.cursor = 'crosshair';
            }
        });
    });
}

function initializeDropzones() {
    document.querySelectorAll('.postit-dropzone').forEach(dropzone => {
        dropzone.removeEventListener('click', handleDropzoneClick);
        dropzone.addEventListener('click', handleDropzoneClick);
    });
}

function handleDropzoneClick(e) {
    if (!AppState.selectedColor) return;
    if (e.target.closest('.postit')) return;
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    const dropzone = e.currentTarget;
    const rect = dropzone.getBoundingClientRect();
    const x = e.clientX - rect.left - 21;
    const y = e.clientY - rect.top - 21;

    createPostit(AppState.selectedColor, Math.max(0, x), Math.max(0, y), dropzone);

    AppState.selectedColor = null;
    document.querySelectorAll('.postit-color').forEach(c => c.classList.remove('selected'));
    document.body.style.cursor = 'default';
}

function attachSectionEventListeners() {
    // Delete section
    document.querySelectorAll('.delete-section-btn').forEach(btn => {
        btn.onclick = function () {
            const item = this.closest('.grid-stack-item');
            if (item && confirm('Delete this section?')) {
                const id = item.getAttribute('gs-id');
                AppState.grid.removeWidget(item);
                AppState.lockedSections.delete(id);
                logEvent('delete', id, 'section', 'Deleted');
                scheduleAutoSave();
            }
        };
    });

    // Lock section
    document.querySelectorAll('.lock-btn').forEach(btn => {
        btn.onclick = function () {
            const item = this.closest('.grid-stack-item');
            if (item) {
                toggleSectionLock(item.getAttribute('gs-id'));
            }
        };
    });

    // KPI delete
    document.querySelectorAll('.kpi-delete-btn').forEach(btn => {
        btn.onclick = function () {
            this.closest('.kpi-item')?.remove();
            scheduleAutoSave();
        };
    });

    // KPI add
    document.querySelectorAll('.add-kpi-btn').forEach(btn => {
        btn.onclick = function () {
            const section = this.closest('.grid-stack-item-content');
            const container = section.querySelector('.kpi-container');
            const item = document.createElement('div');
            item.className = 'kpi-item';
            item.innerHTML = `
                        <div class="kpi-indicator green" data-status="green" onclick="cycleKPIStatus(this)"></div>
                        <input type="text" value="New KPI" />
                        <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
                    `;
            container.appendChild(item);
            item.querySelector('.kpi-delete-btn').onclick = function () { item.remove(); scheduleAutoSave(); };
            scheduleAutoSave();
        };
    });

    // Action row add
    document.querySelectorAll('.add-row').forEach(row => {
        row.onclick = function () {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                        <td><input type="text" placeholder="Enter action..." /></td>
                        <td><input type="date" /></td>
                        <td><select class="action-owner-select"><option value="">-- Select --</option></select></td>
                        <td><select><option value="todo">To Do</option><option value="inprogress">In Progress</option><option value="done">Done</option></select></td>
                    `;
            this.parentElement.insertBefore(newRow, this);
            updateAllOwnerDropdowns();
            scheduleAutoSave();
        };
    });

    // Week plan buttons
    document.querySelectorAll('.add-week-btn').forEach(btn => {
        btn.onclick = function () {
            const section = this.closest('.grid-stack-item-content');
            const weeksContainer = section.querySelector('.weeks-container');
            const numWeeks = weeksContainer.children.length;
            const numTracks = section.querySelectorAll('.track-item').length;

            const newWeek = document.createElement('div');
            newWeek.className = 'week-column';
            newWeek.setAttribute('data-week-index', numWeeks);
            let cells = '';
            for (let i = 0; i < numTracks; i++) {
                cells += '<div class="week-cell postit-dropzone"></div>';
            }
            newWeek.innerHTML = `<div class="week-header">Week ${numWeeks + 1}</div>${cells}`;
            weeksContainer.appendChild(newWeek);

            // Update week numbers
            const dateInput = section.querySelector('.week-start-date');
            if (dateInput) updateWeekNumbers(dateInput);

            initializeDropzones();
            scheduleAutoSave();
        };
    });

    document.querySelectorAll('.add-track-btn').forEach(btn => {
        btn.onclick = function () {
            const section = this.closest('.grid-stack-item-content');
            const trackColumn = section.querySelector('.track-column');
            const weeksContainer = section.querySelector('.weeks-container');

            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.innerHTML = '<input type="text" value="New Track" />';
            trackColumn.appendChild(trackItem);

            weeksContainer.querySelectorAll('.week-column').forEach(week => {
                const cell = document.createElement('div');
                cell.className = 'week-cell postit-dropzone';
                week.appendChild(cell);
            });

            initializeDropzones();
            scheduleAutoSave();
        };
    });

    // Kanban add column
    document.querySelectorAll('.add-column-btn').forEach(btn => {
        btn.onclick = function () {
            const section = this.closest('.grid-stack-item-content');
            const container = section.querySelector('.kanban-container');

            const newColumn = document.createElement('div');
            newColumn.className = 'kanban-column';
            // Use a default class or random color for the new column header border
            newColumn.innerHTML = `
                <div class="kanban-column-header" style="border-bottom-color: var(--gray-400)">
                    <input type="text" value="New Column" style="background:transparent;border:none;color:white;font-weight:bold;width:100%;text-align:center;" onclick="event.stopPropagation()">
                </div>
                <div class="kanban-dropzone postit-dropzone"></div>
            `;

            container.appendChild(newColumn);
            initializeDropzones();
            scheduleAutoSave();
        };
    });

    // Auto-save on input changes
    document.querySelectorAll('.section-title, .text-content, .track-item input').forEach(input => {
        input.addEventListener('input', scheduleAutoSave);
    });

    // Attach team table events
    attachTeamTableEvents();
}

function attachTeamTableEvents() {
    // Add team member row button
    document.querySelectorAll('.add-team-row').forEach(row => {
        row.onclick = function () {
            const tbody = this.closest('tbody');
            addTeamMemberRow(tbody);
        };
    });

    // Attach events to existing team member rows
    document.querySelectorAll('.team-member-row').forEach(row => {
        attachTeamRowEvents(row);
    });

    // Initial update of team members
    updateTeamMembersFromTable();
}

function addSection(type, options = {}) {
    const id = generateId('section');
    let content = '';
    let w = 3, h = 3;

    switch (type) {
        case 'text':
            content = createTextSection(options.title || 'New Section');
            w = 2; h = 3;
            break;
        case 'team':
            content = createTeamSection(options.title || 'Team');
            w = 2; h = 3;
            break;
        case 'kpi':
            content = createKPISection(options.title || 'Project KPIs');
            w = 2; h = 3;
            break;
        case 'matrix':
            content = createMatrixSection(options.title || 'Risk Matrix', options.xLabel || 'Probability', options.yLabel || 'Consequence');
            w = 2; h = 4;
            break;
        case 'weekplan':
            content = createWeekPlanSection(options.title || 'Week Plan');
            w = 8; h = 5;
            break;
        case 'actions':
            content = createActionsSection(options.title || 'Actions');
            w = 3; h = 3;
            break;
        case 'postit-area':
            content = createPostitAreaSection(options.title || 'Ideas');
            w = 3; h = 4;
            break;
        case 'kanban':
            content = createKanbanSection(options.title || 'Kanban Board');
            w = 4; h = 4;
            break;
    }

    AppState.grid.addWidget({ id, w, h, content });
    logEvent('create', id, 'section', { type });

    // If team section, attach events after creation
    if (type === 'team') {
        setTimeout(() => {
            attachTeamTableEvents();
        }, 100);
    }
}

function createDefaultBoard() {
    // Layout based on screenshot:
    // Left column (x=0, w=2): Project Name, Team, Purpose, Success Criteria
    // Middle (x=2, w=8): Week Plan (top), Actions (bottom)
    // Right column (x=10, w=2): KPIs, Project Risk, Improvement Ideas

    // Left column - stacked vertically
    AppState.grid.addWidget({
        id: generateId('section'),
        x: 0, y: 0, w: 2, h: 2,
        content: createTextSection('Project Name')
    });

    AppState.grid.addWidget({
        id: generateId('section'),
        x: 0, y: 2, w: 2, h: 2,
        content: createTeamSection('Team')
    });

    AppState.grid.addWidget({
        id: generateId('section'),
        x: 0, y: 4, w: 2, h: 2,
        content: createTextSection('Purpose')
    });

    AppState.grid.addWidget({
        id: generateId('section'),
        x: 0, y: 6, w: 2, h: 2,
        content: createTextSection('Success Criteria')
    });

    // Middle column - Week Plan on top, Actions below
    AppState.grid.addWidget({
        id: generateId('section'),
        x: 2, y: 0, w: 8, h: 6,
        content: createWeekPlanSection('Week Plan')
    });

    AppState.grid.addWidget({
        id: generateId('section'),
        x: 2, y: 6, w: 8, h: 3,
        content: createActionsSection('Actions')
    });

    // Right column - KPIs, Risk Matrix, Improvement Ideas
    AppState.grid.addWidget({
        id: generateId('section'),
        x: 10, y: 0, w: 2, h: 3,
        content: createKPISection("Project KPI's")
    });

    AppState.grid.addWidget({
        id: generateId('section'),
        x: 10, y: 3, w: 2, h: 3,
        content: createMatrixSection('Project Risk', 'Probability', 'Consequence')
    });

    AppState.grid.addWidget({
        id: generateId('section'),
        x: 10, y: 6, w: 2, h: 3,
        content: createMatrixSection('Improvement Ideas', 'Ease', 'Impact')
    });

    // Initialize after all widgets are added
    setTimeout(() => {
        initializeDropzones();
        attachSectionEventListeners();
        attachTeamTableEvents();

        // Update week numbers for all week plans
        document.querySelectorAll('.week-start-date').forEach(input => {
            updateWeekNumbers(input);
        });
    }, 100);
}

function updateDisplays() {
    // Events tab
    const eventBody = document.getElementById('eventLogBody');
    if (eventBody) {
        eventBody.innerHTML = AppState.eventLog.slice(0, 100).map(e => `
                    <tr>
                        <td>${e.timestamp}</td>
                        <td><span class="event-type ${e.type}">${e.type}</span></td>
                        <td>${e.elementId}</td>
                        <td>${e.elementType}</td>
                        <td>${e.details}</td>
                    </tr>
                `).join('');
    }

    // Postits tab
    const postitBody = document.getElementById('postitLogBody');
    if (postitBody) {
        postitBody.innerHTML = Object.values(AppState.postits).map(p => {
            const el = document.getElementById(p.id);
            let loc1 = '-';
            let loc2 = '-';

            if (el) {
                const ctx = getColumnContext(el);
                if (ctx.type === 'kanban') {
                    loc1 = ctx.details.column;
                    loc2 = '-';
                } else if (ctx.type === 'weekplan') {
                    loc1 = ctx.details.week;
                    loc2 = ctx.details.track;
                } else if (ctx.type === 'matrix') {
                    loc1 = ctx.details.quadrant;
                    loc2 = `Score: ${p.xValue * p.yValue}`;
                } else {
                    loc1 = `X:${Math.round(p.x)}`;
                    loc2 = `Y:${Math.round(p.y)}`;
                }
            } else {
                loc1 = `X:${Math.round(p.x)}`;
                loc2 = `Y:${Math.round(p.y)}`;
            }

            return `
                    <tr>
                        <td><span style="background:${getPostitColor(p.color)};padding:2px 8px;border-radius:4px;">${p.color}</span></td>
                        <td>${p.content || '-'}</td>
                        <td>${p.owner || '-'}</td>
                        <td>${p.status}</td>
                        <td>${loc1}</td>
                        <td>${loc2}</td>
                        <td>${p.id}</td>
                    </tr>
                `;
        }).join('');
    }

    // Matrix tab
    const matrixBody = document.getElementById('matrixLogBody');
    if (matrixBody) {
        matrixBody.innerHTML = AppState.matrixLog.slice(0, 100).map(m => `
                    <tr>
                        <td>${m.timestamp}</td>
                        <td>${m.postitId}</td>
                        <td>${m.sectionId}</td>
                        <td>${m.xLabel}</td>
                        <td>${m.xValue}</td>
                        <td>${m.yLabel}</td>
                        <td>${m.yValue}</td>
                        <td><strong>${m.score}</strong></td>
                    </tr>
                `).join('');
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    const overlay = document.getElementById('authLoadingOverlay');
    const pageContent = document.getElementById('pageContent');

    // Quick check - no token means redirect immediately
    if (!apiClient.isAuthenticated()) {
        window.location.replace('login.html');
        return;
    }

    // Validate token with backend
    const user = await apiClient.getCurrentUser().catch(() => null);

    if (!user || (!user.user && !user.id)) {
        // Token invalid - clear and redirect
        apiClient.clearToken();
        window.location.replace('login.html');
        return;
    }

    // Auth successful - hide overlay and reveal content
    if (overlay) overlay.classList.add('hidden');
    if (pageContent) pageContent.classList.add('visible');

    // Set user ID
    AppState.userId = user.user ? user.user.id : user.id;

    // Initialize Grid with default settings (will be updated if role is member)
    initializeGrid();
    initializePostitPalette();

    const boardSlug = window.location.hash.substring(1);
    if (boardSlug) {
        AppState.boardKey = `vimpl-board-${boardSlug}`;
        const boardName = boardSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        document.getElementById('projectTitle').value = boardName;
    }

    // Check for ?new=true URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isNewBoard = urlParams.get('new') === 'true';

    if (isNewBoard) {
        // Clear any existing state and create fresh board
        localStorage.removeItem(AppState.boardKey); // Legacy clear
        AppState.postits = {};
        AppState.eventLog = [];
        AppState.matrixLog = [];
        AppState.lockedSections = new Set();
        AppState.teamMembers = [];

        // Remove the ?new=true from URL without reload
        window.history.replaceState({}, document.title, window.location.pathname);

        createDefaultBoard();
    } else {
        // Try to load saved state
        const loaded = await loadBoardState();
        if (!loaded) {
            console.log("No remote state found, creating default board.");
            createDefaultBoard();
        }

        // Show edit button if admin
        if (currentUserRole === 'admin') {
            const editBtn = document.getElementById('editLayout');
            if (editBtn) editBtn.style.display = 'flex';
        }
    }

    setTimeout(() => {
        initializeDropzones();
        attachSectionEventListeners();
    }, 600);

    // Edit Layout Button
    document.getElementById('editLayout').addEventListener('click', toggleEditMode);

    // Backend modal
    document.getElementById('showBackend').addEventListener('click', () => {
        document.getElementById('backendModal').classList.add('active');
        updateDisplays();
    });
    document.getElementById('closeBackend').addEventListener('click', () => {
        document.getElementById('backendModal').classList.remove('active');
    });

    // Add section modal
    document.getElementById('addSection').addEventListener('click', () => {
        document.getElementById('addSectionModal').classList.add('active');
    });
    document.getElementById('closeAddSection').addEventListener('click', () => {
        document.getElementById('addSectionModal').classList.remove('active');
    });

    // Section type selection
    document.getElementById('sectionTypes').addEventListener('click', (e) => {
        const card = e.target.closest('.section-type-card');
        if (card) {
            addSection(card.getAttribute('data-type'));
            document.getElementById('addSectionModal').classList.remove('active');
        }
    });

    // New Board Button
    const newBoardBtn = document.getElementById('newBoard');
    if (newBoardBtn) {
        newBoardBtn.addEventListener('click', async () => {
            // If we have an API client, we can create a real board.
            // Since we are mocking, we can just simulate it.
            // We'll use the 'New' button to create a generic new board.
            if (confirm("Create a new empty board?")) {
                try {
                    const user = await apiClient.getCurrentUser();
                    const userId = user.user ? user.user.id : (user.id || 'user_1'); // Fallback
                    const { board } = await apiClient.createBoard('New Board', 'Created from board view');
                    window.location.href = `board.html?id=${board.id}`;
                } catch (e) {
                    console.error(e);
                    alert("Failed to create board");
                }
            }
        });
    }

    // Export
    document.getElementById('exportBoard').addEventListener('click', () => {
        const data = localStorage.getItem(AppState.boardKey);
        if (data) {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vimpl-board-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    });

    // Post-it form events
    document.getElementById('closePostitForm').addEventListener('click', closePostitForm);

    ['formContent', 'formOwner', 'formStatus', 'formXValue', 'formYValue', 'formMitigation'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                savePostitForm();
                if (id === 'formXValue' || id === 'formYValue') {
                    updateScoreDisplay();
                }
            });
            el.addEventListener('change', savePostitForm);
        }
    });

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById('eventsTab').style.display = tabName === 'events' ? 'block' : 'none';
            document.getElementById('postitsTab').style.display = tabName === 'postits' ? 'block' : 'none';
            document.getElementById('matrixTab').style.display = tabName === 'matrix' ? 'block' : 'none';
        });
    });

    // Close modals on outside click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // Click outside to close postit form
    document.addEventListener('click', (e) => {
        const form = document.getElementById('postitForm');
        if (form.style.display !== 'none' && !form.contains(e.target) && !e.target.closest('.postit')) {
            closePostitForm();
        }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            AppState.selectedColor = null;
            document.querySelectorAll('.postit-color').forEach(c => c.classList.remove('selected'));
            document.body.style.cursor = 'default';
            closePostitForm();
        }
    });

    // Save before unload
    window.addEventListener('beforeunload', () => {
        saveBoardState();
    });

    // Project title auto-save
    document.getElementById('projectTitle').addEventListener('input', scheduleAutoSave);
});