// frontend/js/caregiver.js
// Caregiver Portal JavaScript

let allRequests = [];
let currentFilter = 'all';

// Load caregiver dashboard
async function loadCaregiverDashboard() {
    try {
        const stats = await apiCall('/caregiver/stats');
        document.getElementById('pendingRequests').textContent = stats.pending || 0;
        document.getElementById('acceptedRequests').textContent = stats.accepted || 0;
        document.getElementById('inProgressRequests').textContent = stats.inProgress || 0;
        document.getElementById('completedRequests').textContent = stats.completed || 0;
        document.getElementById('totalEarnings').textContent = `$${stats.earnings || 0}`;
        
        // Load all requests
        await loadAllRequests();
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showToast('Failed to load dashboard', 'error');
    }
}

// Load all requests
async function loadAllRequests() {
    try {
        allRequests = await apiCall('/caregiver/requests');
        displayRequests();
    } catch (error) {
        console.error('Failed to load requests:', error);
        showToast('Failed to load requests', 'error');
    }
}

// Display requests based on filter
function displayRequests() {
    const container = document.getElementById('requestsList');
    if (!container) return;
    
    let filtered = allRequests;
    if (currentFilter !== 'all') {
        filtered = allRequests.filter(r => r.status.toLowerCase().replace(' ', '-') === currentFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="loading">No service requests found</p>';
        return;
    }
    
    container.innerHTML = filtered.map(req => `
        <div class="request-card ${req.status.toLowerCase().replace(' ', '-')}">
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                <div style="flex: 1;">
                    <h3>${req.patientName || 'Patient'}</h3>
                    <p><strong>📍 Service:</strong> ${req.caregiverName}</p>
                    <p><strong>📅 Date:</strong> ${new Date(req.date).toLocaleDateString()}</p>
                    <p><strong>⏰ Time:</strong> ${req.timeSlot || 'Flexible'}</p>
                    <p><strong>⏱️ Duration:</strong> ${req.duration} hours</p>
                    <p><strong>💰 Amount:</strong> $${req.totalAmount || 0}</p>
                    <p><strong>📍 Address:</strong> ${req.patientAddress || 'Not provided'}</p>
                    ${req.careNotes ? `<p><strong>📝 Care Notes:</strong> ${typeof req.careNotes === 'string' ? req.careNotes : 'Notes added'}</p>` : ''}
                </div>
                <div style="text-align: right;">
                    <span class="status-badge status-${req.status.toLowerCase().replace(' ', '-')}">${req.status}</span>
                    <p style="margin-top: 8px;"><strong>Patient:</strong> ${req.patientPhone || 'No phone'}</p>
                </div>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${req.status === 'Pending' ? `
                    <button class="btn-accept" onclick="acceptRequest('${req._id}')">✓ Accept Request</button>
                    <button class="btn-reject" onclick="rejectRequest('${req._id}')">✗ Reject</button>
                ` : ''}
                ${req.status === 'Accepted' ? `
                    <button class="btn-start" onclick="startService('${req._id}')">▶ Start Service</button>
                ` : ''}
                ${req.status === 'In Progress' ? `
                    <button class="btn-complete" onclick="openCareNotesModal('${req._id}')">✓ Complete Service</button>
                ` : ''}
                ${req.status === 'Completed' && req.careNotes ? `
                    <button class="btn-view" onclick="viewCareNotes('${req._id}')">📋 View Care Notes</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Accept request
async function acceptRequest(requestId) {
    if (confirm('Accept this service request?')) {
        try {
            await apiCall(`/caregiver/requests/${requestId}/accept`, { method: 'PUT' });
            showToast('Request accepted successfully');
            loadAllRequests();
            loadCaregiverDashboard();
        } catch (error) {
            showToast('Failed to accept request', 'error');
        }
    }
}

// Reject request
async function rejectRequest(requestId) {
    if (confirm('Reject this service request?')) {
        try {
            await apiCall(`/caregiver/requests/${requestId}/reject`, { method: 'PUT' });
            showToast('Request rejected');
            loadAllRequests();
            loadCaregiverDashboard();
        } catch (error) {
            showToast('Failed to reject request', 'error');
        }
    }
}

// Start service
async function startService(requestId) {
    if (confirm('Start this service now?')) {
        try {
            await apiCall(`/caregiver/requests/${requestId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'In Progress' })
            });
            showToast('Service started');
            loadAllRequests();
            loadCaregiverDashboard();
        } catch (error) {
            showToast('Failed to start service', 'error');
        }
    }
}

// Open care notes modal
function openCareNotesModal(bookingId) {
    document.getElementById('careNotesBookingId').value = bookingId;
    document.getElementById('careNotesText').value = '';
    document.getElementById('careNotesModal').style.display = 'flex';
}

// Close care notes modal
function closeCareNotesModal() {
    document.getElementById('careNotesModal').style.display = 'none';
}

// Save care notes and complete service
async function saveCareNotes() {
    const bookingId = document.getElementById('careNotesBookingId').value;
    const notes = document.getElementById('careNotesText').value;
    
    if (!notes) {
        showToast('Please add care notes', 'error');
        return;
    }
    
    try {
        await apiCall(`/caregiver/requests/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'Completed', notes: notes })
        });
        closeCareNotesModal();
        showToast('Service completed successfully');
        loadAllRequests();
        loadCaregiverDashboard();
    } catch (error) {
        showToast('Failed to complete service', 'error');
    }
}

// Load earnings
async function loadEarnings() {
    try {
        const earnings = await apiCall('/caregiver/earnings');
        document.getElementById('totalEarningsAmount').textContent = `$${earnings.total || 0}`;
        document.getElementById('thisMonthEarnings').textContent = `$${earnings.thisMonth || 0}`;
        document.getElementById('completedServices').textContent = earnings.completedCount || 0;
        
        const historyContainer = document.getElementById('earningsHistory');
        if (historyContainer) {
            if (earnings.history && earnings.history.length > 0) {
                historyContainer.innerHTML = earnings.history.map(e => `
                    <div class="booking-card">
                        <div>
                            <strong>${e.serviceType}</strong>
                            <br>
                            <small>${new Date(e.date).toLocaleDateString()}</small>
                            <br>
                            <small>Patient: ${e.patientName}</small>
                        </div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #10b981;">$${e.amount}</div>
                        <div><span class="status-badge status-completed">Completed</span></div>
                    </div>
                `).join('');
            } else {
                historyContainer.innerHTML = '<p class="loading">No completed services yet</p>';
            }
        }
    } catch (error) {
        console.error('Failed to load earnings:', error);
        showToast('Failed to load earnings', 'error');
    }
}

// Load caregiver profile
async function loadCaregiverProfile() {
    try {
        const profile = await apiCall('/caregiver/profile');
        document.getElementById('caregiverNameInput').value = profile.name || '';
        document.getElementById('caregiverEmail').value = profile.email || '';
        document.getElementById('caregiverPhone').value = profile.phone || '';
        document.getElementById('caregiverService').value = profile.service || 'Companionship';
        document.getElementById('caregiverExperience').value = profile.experience || 0;
        document.getElementById('caregiverBio').value = profile.bio || '';
        document.getElementById('caregiverRate').value = profile.hourlyRate || 25;
        
        const verifiedBadge = document.getElementById('verifiedBadge');
        if (verifiedBadge) {
            verifiedBadge.textContent = profile.verified ? '✓ Verified' : 'Pending Verification';
            verifiedBadge.style.color = profile.verified ? '#10b981' : '#f59e0b';
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('Failed to load profile', 'error');
    }
}

// Update caregiver profile
async function updateCaregiverProfile(e) {
    e.preventDefault();
    const profileData = {
        name: document.getElementById('caregiverNameInput').value,
        phone: document.getElementById('caregiverPhone').value,
        service: document.getElementById('caregiverService').value,
        experience: parseInt(document.getElementById('caregiverExperience').value),
        bio: document.getElementById('caregiverBio').value,
        hourlyRate: parseInt(document.getElementById('caregiverRate').value)
    };
    
    try {
        await apiCall('/caregiver/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        showToast('Profile updated successfully');
        
        // Update displayed name in header
        const nameSpan = document.getElementById('caregiverName');
        if (nameSpan) nameSpan.textContent = profileData.name;
    } catch (error) {
        showToast('Failed to update profile', 'error');
    }
}

// Set caregiver name in header
async function setCaregiverName() {
    try {
        const profile = await apiCall('/caregiver/profile');
        const nameSpan = document.getElementById('caregiverName');
        if (nameSpan && profile.name) {
            nameSpan.textContent = profile.name;
        }
    } catch (error) {
        console.error('Failed to get caregiver name:', error);
    }
}

// Tab navigation
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        displayRequests();
    });
});

// Page initialization
document.addEventListener('DOMContentLoaded', async () => {
    const token = getToken();
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'caregiver') {
            window.location.href = '/dashboard.html';
            return;
        }
        
        const path = window.location.pathname;
        
        if (path.includes('caregiver-dashboard.html')) {
            await setCaregiverName();
            await loadCaregiverDashboard();
        } else if (path.includes('caregiver-earnings.html')) {
            await setCaregiverName();
            await loadEarnings();
        } else if (path.includes('caregiver-profile.html')) {
            await loadCaregiverProfile();
            document.getElementById('caregiverProfileForm')?.addEventListener('submit', updateCaregiverProfile);
        } else if (path.includes('caregiver-requests.html')) {
            await setCaregiverName();
            await loadAllRequests();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        window.location.href = '/login.html';
    }
});