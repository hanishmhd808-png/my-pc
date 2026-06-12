// --- State Management ---
const INITIAL_STAFF = [
    { id: '1', name: 'Rizwan', role: 'Camera Man', status: 'out' },
    { id: '2', name: 'Hanish', role: 'Editor & Social Media Handling', status: 'out' },
    { id: '3', name: 'Sarath', role: 'News Sharing & Camera Man', status: 'out' },
    { id: '4', name: 'Jeena', role: 'Anchor', status: 'out' },
    { id: '5', name: 'Azlam', role: 'Editor', status: 'out' }
];

let staffList = JSON.parse(localStorage.getItem('attendance_staff')) || INITIAL_STAFF;

// Ensure new staff are added if local storage already exists
INITIAL_STAFF.forEach(defaultStaff => {
    if (!staffList.some(s => s.id === defaultStaff.id)) {
        staffList.push(defaultStaff);
    }
});
// Save immediately so changes persist
localStorage.setItem('attendance_staff', JSON.stringify(staffList));

let logsList = JSON.parse(localStorage.getItem('attendance_logs')) || [];

// Tracker State
const TRACKER_KEYS = [
    { id: 'yt_cntv', name: 'CNTV', platform: 'youtube', type: 'Videos', icon: '▶️' },
    { id: 'yt_cntv_live', name: 'CNTV Live', platform: 'youtube', type: 'Videos', icon: '🔴' },
    { id: 'fb_ch', name: 'Changaramkulam', platform: 'facebook', type: 'Posts', icon: '👍' },
    { id: 'fb_cntv', name: 'CNTV', platform: 'facebook', type: 'Posts', icon: '👍' },
    { id: 'ig_ch', name: 'Changaramkulam 1', platform: 'instagram', type: 'Posts', icon: '📸' },
    { id: 'ig_cntv', name: 'CNTV Stories', platform: 'instagram', type: 'Stories', icon: '📸' },
    { id: 'wa_news', name: 'News Shared', platform: 'whatsapp', type: 'Shares', icon: '💬' },
    { id: 'wa_ads', name: 'Ads Shared', platform: 'whatsapp', type: 'Shares', icon: '💬' }
];

let trackerLogs = JSON.parse(localStorage.getItem('attendance_tracker')) || {};

function getTodayString() {
    return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
}

if (!trackerLogs[getTodayString()]) {
    trackerLogs[getTodayString()] = {};
}

function saveState() {
    localStorage.setItem('attendance_staff', JSON.stringify(staffList));
    localStorage.setItem('attendance_logs', JSON.stringify(logsList));
    localStorage.setItem('attendance_tracker', JSON.stringify(trackerLogs));
}

// --- Clock Widget ---
function updateClock() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// --- Navigation ---
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view-section');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active nav
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show correct view
        const targetId = btn.getAttribute('data-target');
        views.forEach(v => {
            if (v.id === targetId) {
                v.classList.remove('hidden');
                v.classList.add('active');
            } else {
                v.classList.remove('active');
                v.classList.add('hidden');
            }
        });
    });
});

// --- Core Logic ---
function updateDashboardStats() {
    const inCount = staffList.filter(s => s.status === 'in').length;
    const outCount = staffList.filter(s => s.status === 'out').length;
    
    document.getElementById('stat-in').textContent = inCount;
    document.getElementById('stat-out').textContent = outCount;
}

function renderStaffGrid() {
    const grid = document.getElementById('staff-grid');
    grid.innerHTML = '';
    
    staffList.forEach(staff => {
        const card = document.createElement('div');
        card.className = `staff-card status-${staff.status}`;
        
        const isIn = staff.status === 'in';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="staff-info">
                    <h3>${staff.name}</h3>
                    <p>${staff.role}</p>
                </div>
                <div class="status-badge ${staff.status}">${isIn ? 'In Office' : 'Out'}</div>
            </div>
            <div class="card-actions">
                <button class="action-btn btn-checkin" onclick="handleAction('${staff.id}', 'in')" ${isIn ? 'disabled' : ''}>
                    Check In
                </button>
                <button class="action-btn btn-checkout" onclick="handleAction('${staff.id}', 'out')" ${!isIn ? 'disabled' : ''}>
                    Check Out
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    updateDashboardStats();
}

function renderLogs() {
    const tbody = document.getElementById('logs-body');
    tbody.innerHTML = '';
    
    if (logsList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <p>No activity logs recorded yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort logs by newest first
    const sortedLogs = [...logsList].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedLogs.forEach(log => {
        const dateObj = new Date(log.timestamp);
        const tr = document.createElement('tr');
        
        let actionHtml = '';
        if (log.action === 'in') {
            actionHtml = `<span class="log-action in"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Checked In</span>`;
        } else if (log.action === 'out') {
            actionHtml = `<span class="log-action out"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Checked Out</span>`;
        } else {
            actionHtml = `<span class="log-action" style="color: #60a5fa;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> ${log.action}</span>`;
        }
            
        tr.innerHTML = `
            <td><strong>${log.name}</strong></td>
            <td><span class="text-secondary">${log.role}</span></td>
            <td>${actionHtml}</td>
            <td class="log-time">${dateObj.toLocaleTimeString('en-US', { hour12: false })}</td>
            <td class="log-date">${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        `;
        tbody.appendChild(tr);
    });
}

function handleAction(staffId, action) {
    const staffIndex = staffList.findIndex(s => s.id === staffId);
    if (staffIndex === -1) return;
    
    const staff = staffList[staffIndex];
    if (staff.status === action) return; // Already in that state
    
    // Update status
    staff.status = action;
    
    // Create log entry
    const newLog = {
        id: Date.now().toString(),
        staffId: staff.id,
        name: staff.name,
        role: staff.role,
        action: action,
        timestamp: Date.now()
    };
    
    logsList.push(newLog);
    
    // Save & Re-render
    saveState();
    renderStaffGrid();
    renderLogs();
    
    // Show toast notification
    showToast(`${staff.name} checked ${action} successfully.`);
}

document.getElementById('clear-logs-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all activity logs?')) {
        logsList = [];
        saveState();
        renderLogs();
        showToast('Logs cleared.');
    }
});

function getSelectedTrackerStaff() {
    return document.getElementById('tracker-staff-select').value;
}

function updateTrackerCount(id, delta) {
    const staffId = getSelectedTrackerStaff();
    if (!staffId) {
        showToast('Please select a staff member first.');
        return;
    }
    
    const today = getTodayString();
    
    if (!trackerLogs[today][staffId]) {
        trackerLogs[today][staffId] = {};
    }
    
    let current = trackerLogs[today][staffId][id] || 0;
    current += delta;
    if (current < 0) current = 0; // Prevent negative counts
    
    trackerLogs[today][staffId][id] = current;
    
    // Add log entry for accountability
    if (delta > 0) {
        const staff = staffList.find(s => s.id === staffId);
        const platform = TRACKER_KEYS.find(k => k.id === id);
        logsList.push({
            id: Date.now().toString(),
            staffId: staffId,
            name: staff.name,
            role: staff.role,
            action: `Uploaded ${platform.type} to ${platform.name} (${platform.platform})`,
            timestamp: Date.now()
        });
        renderLogs();
    }
    
    saveState();
    renderTrackerGrid();
}

function renderTrackerGrid() {
    const grid = document.getElementById('tracker-grid');
    grid.innerHTML = '';
    const today = getTodayString();
    const staffId = getSelectedTrackerStaff();
    
    document.getElementById('tracker-date-display').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    
    TRACKER_KEYS.forEach(k => {
        let count = 0;
        if (staffId && trackerLogs[today][staffId]) {
            count = trackerLogs[today][staffId][k.id] || 0;
        }
        
        const card = document.createElement('div');
        card.className = `tracker-card ${k.platform}`;
        
        card.innerHTML = `
            <div class="tracker-header">
                <h3>${k.icon} ${k.name}</h3>
                <p>${k.platform.charAt(0).toUpperCase() + k.platform.slice(1)} • ${k.type}</p>
            </div>
            <div class="counter-controls">
                <button class="counter-btn" onclick="updateTrackerCount('${k.id}', -1)">-</button>
                <div class="counter-value">${count}</div>
                <button class="counter-btn" onclick="updateTrackerCount('${k.id}', 1)">+</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- UI Utilities ---
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    
    toastMsg.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// --- Initialization ---
function init() {
    // Populate staff dropdown
    const select = document.getElementById('tracker-staff-select');
    staffList.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
    
    select.addEventListener('change', renderTrackerGrid);

    renderStaffGrid();
    renderLogs();
    renderTrackerGrid();
}

// Run init when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
