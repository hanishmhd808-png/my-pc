// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyAQy_O2J5MUdbWUjvwEqkcpjbn_jGUQudc",
  authDomain: "report-9ea66.firebaseapp.com",
  projectId: "report-9ea66",
  storageBucket: "report-9ea66.firebasestorage.app",
  messagingSenderId: "107247403212",
  appId: "1:107247403212:web:eca4e27e7eba3593f10269"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const appStateRef = db.collection('app_state').doc('main');

// --- State Management ---
const INITIAL_STAFF = [
    { id: '1', name: 'Rizwan', role: 'Camera Man', status: 'out' },
    { id: '2', name: 'Hanish', role: 'Editor & Social Media Handling', status: 'out' },
    { id: '3', name: 'Sarath', role: 'News Sharing & Camera Man', status: 'out' },
    { id: '4', name: 'Jeena', role: 'Anchor', status: 'out' },
    { id: '5', name: 'Azlam', role: 'Editor', status: 'out' }
];

let staffList = [...INITIAL_STAFF];
let logsList = [];
let trackerLogs = {};

// Wait for Firebase to load before starting app
let isAppInitialized = false;

appStateRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        if (data.staffList) {
            staffList = data.staffList;
            // Ensure any new staff defaults are added
            INITIAL_STAFF.forEach(defaultStaff => {
                if (!staffList.some(s => s.id === defaultStaff.id)) {
                    staffList.push(defaultStaff);
                }
            });
        }
        if (data.logsList) logsList = data.logsList;
        if (data.trackerLogs) trackerLogs = data.trackerLogs;
    } else {
        // Document doesn't exist yet (first run)
        saveState();
    }
    
    if (!isAppInitialized) {
        isAppInitialized = true;
        init();
    } else {
        // Real-time update from another device
        renderStaffGrid();
        renderLogs();
        renderTrackerGrid();
    }
});

function saveState() {
    appStateRef.set({
        staffList: staffList,
        logsList: logsList,
        trackerLogs: trackerLogs,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => {
        console.error("Firebase save error:", err);
        showToast("Error saving to cloud!");
    });
}

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

function getTodayString() {
    return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
}

if (!trackerLogs[getTodayString()]) {
    trackerLogs[getTodayString()] = {};
}

// --- Clock Widget ---
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: true });
    const dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    
    // Desktop sidebar clock
    const cTime = document.getElementById('current-time');
    const cDate = document.getElementById('current-date');
    if (cTime) cTime.textContent = timeString;
    if (cDate) cDate.textContent = dateString;
    
    // Mobile/Global header clock
    const tTime = document.getElementById('top-time');
    const tDate = document.getElementById('top-date');
    if (tTime) tTime.textContent = timeString;
    if (tDate) tDate.textContent = dateString;
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
                <td colspan="6">
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
    
    sortedLogs.forEach((log, index) => {
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
            <td><span class="text-secondary" style="font-size: 0.85em; opacity: 0.7;">${index + 1}</span></td>
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
    submitActionToGoogleForm(staff.name, action);
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
    
    const saveTrackerBtn = document.getElementById('save-tracker-btn');
    if (saveTrackerBtn) {
        saveTrackerBtn.addEventListener('click', submitTrackerToGoogleForm);
    }

    renderStaffGrid();
    renderLogs();
    renderTrackerGrid();
}

// --- Google Form Integration ---
const GOOGLE_FORM_MAPPING = {
    'Rizwan': 'entry.721255746',
    'Hanish': 'entry.1920159151',
    'Sarath': 'entry.533035882',
    'Jeena': 'entry.222764724',
    'Azlam': 'entry.1013973910'
};
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfNBh-L6JnPpmOLr-lZFyQSEguIfcUzY35LI5IeHJbxuy5Bhg/formResponse';

function submitActionToGoogleForm(staffName, action) {
    let iframe = document.getElementById('hidden_iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = 'hidden_iframe';
        iframe.id = 'hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    
    const form = document.createElement('form');
    form.action = GOOGLE_FORM_URL;
    form.method = 'POST';
    form.target = 'hidden_iframe';
    
    // Add staff field
    const fieldName = GOOGLE_FORM_MAPPING[staffName];
    if (fieldName) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = fieldName;
        // Exact values to match the Google Form dropdowns
        input.value = action === 'in' ? 'check in' : 'check out';
        form.appendChild(input);
    }

    // Add required Google Form hidden fields
    const hiddenData = {
        'fvv': '1',
        'partialResponse': '[null,null,"-2337219535297129586"]',
        'pageHistory': '0',
        'fbzx': '-2337219535297129586'
    };
    for (let key in hiddenData) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = hiddenData[key];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    
    // Cleanup form
    setTimeout(() => { document.body.removeChild(form); }, 1000);
}

function submitTrackerToGoogleForm() {
    const select = document.getElementById('tracker-staff-select');
    const staffId = select.value;
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;

    const today = getTodayString();
    
    let uploadString = 'No uploads recorded yet.';
    if (trackerLogs[today] && trackerLogs[today][staffId]) {
        const counts = [];
        TRACKER_KEYS.forEach(k => {
            const val = trackerLogs[today][staffId][k.id];
            if (val > 0) {
                counts.push(`${val} ${k.name} (${k.platform} ${k.type})`);
            }
        });
        if (counts.length > 0) {
            uploadString = counts.join(', ');
        } else {
            alert('No work recorded for today yet. Please add some uploads first.');
            return;
        }
    } else {
        alert('No work recorded for today yet. Please add some uploads first.');
        return;
    }

    if(!confirm(`Submit this work for ${staff.name} to the Google Form?\n\n${uploadString}`)) return;

    const btn = document.getElementById('save-tracker-btn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = 'Saving...';
    btn.disabled = true;

    let iframe = document.getElementById('hidden_iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = 'hidden_iframe';
        iframe.id = 'hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }

    iframe.onload = function() {
        showToast(`Work for ${staff.name} saved to Google Form!`);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        iframe.onload = null;
    };

    const form = document.createElement('form');
    form.action = GOOGLE_FORM_URL;
    form.method = 'POST';
    form.target = 'hidden_iframe';
    
    const fieldName = GOOGLE_FORM_MAPPING[staff.name];
    if (fieldName) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = fieldName;
        input.value = `Work: ${uploadString}`;
        form.appendChild(input);
    }

    const hiddenData = {
        'fvv': '1',
        'partialResponse': '[null,null,"-2337219535297129586"]',
        'pageHistory': '0',
        'fbzx': '-2337219535297129586'
    };
    for (let key in hiddenData) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = hiddenData[key];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    
    setTimeout(() => { document.body.removeChild(form); }, 1000);
}
