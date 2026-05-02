// frontend/js/caregiver.js
// Caregiver Portal JavaScript

// Use the global API functions from api.js
// Make sure api.js is loaded before this file

let allRequests = [];
let currentFilter = 'all';

// Load caregiver dashboard
async function loadCaregiverDashboard() {
    try {
        // Use the global apiCall function
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
        if (typeof showToast === 'function') {
            showToast('Failed to load dashboard', 'error');
        }
    }
}

// Load all requests
async function loadAllRequests() {
    try {
        allRequests = await apiCall('/caregiver/requests');
        displayRequests();
    } catch (error) {
        console.error('Failed to load requests:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to load requests', 'error');
        }
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
        container.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No service requests found</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(req => {
        const statusClass = req.status.toLowerCase().replace(' ', '-');
        return `
            <div class="request-card ${statusClass}" data-id="${req._id}">
                <div class="request-header">
                    <div class="patient-info">
                        <h3>${escapeHtml(req.patientName || 'Patient')}</h3>
                        <p>📞 ${req.patientPhone || 'No phone'}</p>
                    </div>
                    <div>
                        <span class="status-badge status-${statusClass}">${req.status}</span>
                    </div>
                </div>
                
                <div class="request-details">
                    <div class="detail-item"><strong>📍 Address:</strong> ${escapeHtml(req.patientAddress || 'Not provided')}</div>
                    <div class="detail-item"><strong>📅 Date:</strong> ${new Date(req.date).toLocaleDateString()}</div>
                    <div class="detail-item"><strong>⏰ Time:</strong> ${req.timeSlot || 'Flexible'}</div>
                    <div class="detail-item"><strong>⏱️ Duration:</strong> ${req.duration} hours</div>
                    <div class="detail-item"><strong>💰 Amount:</strong> $${req.totalAmount || 0}</div>
                    <div class="detail-item"><strong>📝 Notes:</strong> ${req.notes || 'No notes'}</div>
                </div>
                
                <div class="request-actions">
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
        `;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Accept request
async function acceptRequest(requestId) {
    if (confirm('Accept this service request?')) {
        try {
            await apiCall(`/caregiver/requests/${requestId}/accept`, { method: 'PUT' });
            if (typeof showToast === 'function') showToast('Request accepted successfully');
            await loadAllRequests();
            await loadCaregiverDashboard();
        } catch (error) {
            console.error('Accept error:', error);
            if (typeof showToast === 'function') showToast('Failed to accept request', 'error');
        }
    }
}

// Reject request
async function rejectRequest(requestId) {
    if (confirm('Reject this service request?')) {
        try {
            await apiCall(`/caregiver/requests/${requestId}/reject`, { method: 'PUT' });
            if (typeof showToast === 'function') showToast('Request rejected');
            await loadAllRequests();
            await loadCaregiverDashboard();
        } catch (error) {
            console.error('Reject error:', error);
            if (typeof showToast === 'function') showToast('Failed to reject request', 'error');
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
            if (typeof showToast === 'function') showToast('Service started');
            await loadAllRequests();
            await loadCaregiverDashboard();
        } catch (error) {
            console.error('Start service error:', error);
            if (typeof showToast === 'function') showToast('Failed to start service', 'error');
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
        if (typeof showToast === 'function') showToast('Please add care notes', 'error');
        return;
    }
    
    try {
        await apiCall(`/caregiver/requests/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'Completed', notes: notes })
        });
        closeCareNotesModal();
        if (typeof showToast === 'function') showToast('Service completed successfully');
        await loadAllRequests();
        await loadCaregiverDashboard();
    } catch (error) {
        console.error('Complete service error:', error);
        if (typeof showToast === 'function') showToast('Failed to complete service', 'error');
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
        if (typeof showToast === 'function') showToast('Failed to load earnings', 'error');
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
        if (typeof showToast === 'function') showToast('Failed to load profile', 'error');
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
        if (typeof showToast === 'function') showToast('Profile updated successfully');
        
        // Update displayed name in header
        const nameSpan = document.getElementById('caregiverName');
        if (nameSpan) nameSpan.textContent = profileData.name;
    } catch (error) {
        console.error('Update profile error:', error);
        if (typeof showToast === 'function') showToast('Failed to update profile', 'error');
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

// Filter tabs
function setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            displayRequests();
        });
    });
}

// Initialize page based on URL
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in (using global functions from api.js)
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Current user role:', user.role);
        
        // Verify user is a caregiver
        if (user.role !== 'caregiver') {
            console.log('Not a caregiver, redirecting to user dashboard');
            window.location.href = '/dashboard.html';
            return;
        }
        
        const path = window.location.pathname;
        console.log('Loading page:', path);
        
        if (path.includes('caregiver-dashboard.html')) {
            await setCaregiverName();
            await loadCaregiverDashboard();
            setupTabs();
        } else if (path.includes('caregiver-earnings.html')) {
            await setCaregiverName();
            await loadEarnings();
        } else if (path.includes('caregiver-profile.html')) {
            await loadCaregiverProfile();
            const profileForm = document.getElementById('caregiverProfileForm');
            if (profileForm) {
                profileForm.addEventListener('submit', updateCaregiverProfile);
            }
        } else if (path.includes('caregiver-requests.html')) {
            await setCaregiverName();
            await loadAllRequests();
            setupTabs();
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
});
// Open care notes modal
function openCareNotesModal(bookingId) {
    console.log('Opening care notes modal for booking:', bookingId);
    const modal = document.getElementById('careNotesModal');
    const bookingIdInput = document.getElementById('careNotesBookingId');
    const notesTextarea = document.getElementById('careNotesText');
    
    if (!modal) {
        console.error('Care notes modal not found!');
        alert('Modal not found. Please refresh the page.');
        return;
    }
    
    if (bookingIdInput) {
        bookingIdInput.value = bookingId;
    }
    if (notesTextarea) {
        notesTextarea.value = '';
    }
    
    modal.style.display = 'flex';
}

// Close care notes modal
function closeCareNotesModal() {
    const modal = document.getElementById('careNotesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save care notes and complete service
async function saveCareNotes() {
    const bookingId = document.getElementById('careNotesBookingId')?.value;
    const notes = document.getElementById('careNotesText')?.value;
    
    if (!bookingId) {
        showToast('Error: Booking ID not found', 'error');
        return;
    }
    
    if (!notes) {
        showToast('Please add care notes before completing', 'error');
        return;
    }
    
    try {
        await apiCall(`/caregiver/requests/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'Completed', notes: notes })
        });
        
        closeCareNotesModal();
        showToast('✅ Service completed successfully!');
        
        // Reload the page to update stats
        setTimeout(() => {
            location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Complete service error:', error);
        showToast('Failed to complete service', 'error');
    }
}

// Close success modal
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
    location.reload();
}

// View care notes for completed service
function viewCareNotes(bookingId) {
    const booking = allRequests.find(b => b._id === bookingId);
    if (!booking || !booking.careNotes) {
        showToast('No care notes available for this booking', 'error');
        return;
    }
    
    // Create a modal to display care notes
    let notesModal = document.getElementById('viewNotesModal');
    if (!notesModal) {
        notesModal = document.createElement('div');
        notesModal.id = 'viewNotesModal';
        notesModal.className = 'modal';
        notesModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h2>📋 Care Notes</h2>
                <div id="careNotesContent" style="margin: 1rem 0; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                </div>
                <div class="modal-buttons">
                    <button onclick="closeViewNotesModal()" class="btn-edit">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(notesModal);
    }
    
    const contentDiv = document.getElementById('careNotesContent');
    if (contentDiv) {
        const formattedNotes = typeof booking.careNotes === 'string' 
            ? booking.careNotes.replace(/\n/g, '<br>')
            : JSON.stringify(booking.careNotes);
        
        contentDiv.innerHTML = `
            <p><strong>👤 Caregiver:</strong> ${booking.caregiverName}</p>
            <p><strong>📅 Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
            <p><strong>📝 Notes:</strong></p>
            <p style="white-space: pre-wrap;">${formattedNotes}</p>
            ${booking.completedAt ? `<p><strong>✅ Completed:</strong> ${new Date(booking.completedAt).toLocaleString()}</p>` : ''}
        `;
    }
    
    notesModal.style.display = 'flex';
}

// Close view notes modal
function closeViewNotesModal() {
    const modal = document.getElementById('viewNotesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
// Make functions global for onclick handlers
// Make functions global for onclick handlers
window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;
window.startService = startService;
window.openCareNotesModal = openCareNotesModal;
window.closeCareNotesModal = closeCareNotesModal;
window.saveCareNotes = saveCareNotes;
window.viewCareNotes = viewCareNotes;
window.closeViewNotesModal = closeViewNotesModal;