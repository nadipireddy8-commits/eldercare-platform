// Admin Dashboard JavaScript
// Save this file as: frontend/admin/admin-dashboard.js

// API Configuration
// frontend/admin/admin-dashboard.js
// Get API URL from config
const API_URL = window.API_CONFIG?.BASE_URL || 'https://eldercare-api-4ovh.onrender.com/api';
let bookingsChart = null;
let allCaregivers = [];
let allBookings = [];
let allUsers = [];

// ============ HELPER FUNCTIONS ============

function getToken() {
    return localStorage.getItem('token');
}

async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/login.html';
            throw new Error('Unauthorized');
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
// In the caregiver form submit handler, add rating fields:
const data = {
    name: document.getElementById('caregiverName').value,
    service: document.getElementById('caregiverService').value,
    experience: parseInt(document.getElementById('caregiverExperience').value),
    hourlyRate: parseInt(document.getElementById('caregiverRate').value),
    phone: document.getElementById('caregiverPhone').value,
    email: document.getElementById('caregiverEmail').value,
    description: document.getElementById('caregiverDesc').value,
    rating: parseFloat(document.getElementById('caregiverRating')?.value || 4.5),
    totalReviews: parseInt(document.getElementById('caregiverTotalReviews')?.value || 0)
};

// In editCaregiver function, load rating values:
document.getElementById('caregiverRating').value = caregiver.rating || 4.5;
document.getElementById('caregiverTotalReviews').value = caregiver.totalReviews || 0;

function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${bgColor};color:white;padding:0.75rem 1.5rem;border-radius:8px;z-index:9999;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

// ============ NAVIGATION ============

function showSection(section) {
    // Hide all sections
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('caregiversSection').style.display = 'none';
    document.getElementById('bookingsSection').style.display = 'none';
    document.getElementById('usersSection').style.display = 'none';
    
    // Show selected section
    document.getElementById(`${section}Section`).style.display = 'block';
    
    // Update active nav item
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Load section data
    if (section === 'dashboard') loadDashboard();
    if (section === 'caregivers') loadCaregivers();
    if (section === 'bookings') loadBookings();
    if (section === 'users') loadUsers();
}

// ============ DASHBOARD FUNCTIONS ============

async function loadDashboard() {
    try {
        const stats = await apiCall('/admin/stats');
        
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <h3>${stats.totalUsers || 0}</h3>
                    <p>Total Users</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👩‍⚕️</div>
                    <h3>${stats.totalCaregivers || 0}</h3>
                    <p>Total Caregivers</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <h3>${stats.totalBookings || 0}</h3>
                    <p>Total Bookings</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <h3>$${stats.totalRevenue || 0}</h3>
                    <p>Total Revenue</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏳</div>
                    <h3>${stats.pendingBookings || 0}</h3>
                    <p>Pending Bookings</p>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <h3>${stats.verifiedCaregivers || 0}</h3>
                    <p>Verified Caregivers</p>
                </div>
            `;
        }
        
        // Load recent bookings
        const bookings = await apiCall('/admin/bookings');
        const recentDiv = document.getElementById('recentBookingsList');
        
        if (recentDiv) {
            if (bookings && bookings.length > 0) {
                recentDiv.innerHTML = bookings.slice(0, 10).map(b => `
                    <div style="padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${b.caregiverName || 'Unknown'}</strong>
                            <br>
                            <small style="color: #64748b;">${new Date(b.date).toLocaleDateString()} - ${b.timeSlot || 'Flexible'}</small>
                        </div>
                        <span class="status-badge status-${(b.status || 'Pending').toLowerCase()}">${b.status || 'Pending'}</span>
                    </div>
                `).join('');
            } else {
                recentDiv.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">No bookings yet</p>';
            }
        }
        
        // Create chart
        if (bookingsChart) bookingsChart.destroy();
        const ctx = document.getElementById('bookingsChart');
        if (ctx) {
            bookingsChart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Monthly Bookings',
                        data: [5, 8, 12, 15, 20, 25, 30, 35, 28, 32, 38, 42],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            title: { display: true, text: 'Number of Bookings' }
                        },
                        x: {
                            title: { display: true, text: 'Month' }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = '<div class="stat-card"><h3>Error</h3><p>Failed to load stats. Make sure backend is running.</p></div>';
        }
        showToast('Failed to load dashboard data', 'error');
    }
}

// ============ CAREGIVER MANAGEMENT ============

async function loadCaregivers() {
    try {
        allCaregivers = await apiCall('/admin/caregivers');
        displayCaregivers();
    } catch (error) {
        console.error('Load caregivers error:', error);
        showToast('Failed to load caregivers', 'error');
    }
}

function displayCaregivers() {
    const searchInput = document.getElementById('caregiverSearch');
    const search = searchInput?.value.toLowerCase() || '';
    
    const filtered = allCaregivers.filter(c => 
        c.name.toLowerCase().includes(search) || 
        (c.service && c.service.toLowerCase().includes(search))
    );
    
    const tbody = document.getElementById('caregiversTable');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;">No caregivers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(c => `
        <tr>
            <td><strong>${escapeHtml(c.name)}</strong> ${c.verified ? '✅' : ''}</td>
            <td>${escapeHtml(c.service || 'General Care')}</td>
            <td>${c.experience || 0} years</td>
            <td>$${c.hourlyRate || 25}/hr</td>
            <td>${c.verified ? '<span style="color:#10b981;">Verified</span>' : '<span style="color:#f59e0b;">Pending</span>'}</td>
            <td>⭐ ${c.rating || 0}</td>
            <td>
                ${!c.verified ? `<button class="btn-verify" onclick="verifyCaregiver('${c._id}')">Verify</button>` : ''}
                <button class="btn-edit" onclick="editCaregiver('${c._id}')">Edit</button>
                <button class="btn-delete" onclick="deleteCaregiver('${c._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function verifyCaregiver(id) {
    if (confirm('Verify this caregiver?')) {
        try {
            await apiCall(`/admin/caregivers/${id}/verify`, { method: 'PUT' });
            showToast('✅ Caregiver verified successfully!');
            await loadCaregivers();
            await loadDashboard();
        } catch (error) {
            showToast('Failed to verify caregiver', 'error');
        }
    }
}

async function deleteCaregiver(id) {
    if (confirm('⚠️ Delete this caregiver permanently? This action cannot be undone.')) {
        try {
            await apiCall(`/admin/caregivers/${id}`, { method: 'DELETE' });
            showToast('🗑️ Caregiver deleted successfully');
            await loadCaregivers();
            await loadDashboard();
        } catch (error) {
            showToast('Failed to delete caregiver', 'error');
        }
    }
}

function openCaregiverModal() {
    const modal = document.getElementById('caregiverModal');
    const title = document.getElementById('caregiverModalTitle');
    const form = document.getElementById('caregiverForm');
    if (modal && title && form) {
        title.innerText = 'Add New Caregiver';
        form.reset();
        document.getElementById('caregiverId').value = '';
        modal.style.display = 'flex';
    }
}

function editCaregiver(id) {
    const caregiver = allCaregivers.find(c => c._id === id);
    if (caregiver) {
        document.getElementById('caregiverModalTitle').innerText = 'Edit Caregiver';
        document.getElementById('caregiverId').value = caregiver._id;
        document.getElementById('caregiverName').value = caregiver.name || '';
        document.getElementById('caregiverService').value = caregiver.service || 'Companionship';
        document.getElementById('caregiverExperience').value = caregiver.experience || 0;
        document.getElementById('caregiverRate').value = caregiver.hourlyRate || 25;
        document.getElementById('caregiverPhone').value = caregiver.phone || '';
        document.getElementById('caregiverEmail').value = caregiver.email || '';
        document.getElementById('caregiverDesc').value = caregiver.description || '';
        document.getElementById('caregiverModal').style.display = 'flex';
    }
}

function closeCaregiverModal() {
    document.getElementById('caregiverModal').style.display = 'none';
}

// Save caregiver (add or edit)
document.getElementById('caregiverForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('caregiverId').value;
    const data = {
        name: document.getElementById('caregiverName').value,
        service: document.getElementById('caregiverService').value,
        experience: parseInt(document.getElementById('caregiverExperience').value),
        hourlyRate: parseInt(document.getElementById('caregiverRate').value),
        phone: document.getElementById('caregiverPhone').value,
        email: document.getElementById('caregiverEmail').value,
        description: document.getElementById('caregiverDesc').value
    };
    
    try {
        if (id) {
            await apiCall(`/admin/caregivers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            showToast('✏️ Caregiver updated successfully');
        } else {
            await apiCall('/admin/caregivers', { method: 'POST', body: JSON.stringify(data) });
            showToast('➕ New caregiver added successfully');
        }
        closeCaregiverModal();
        await loadCaregivers();
        await loadDashboard();
    } catch (error) {
        showToast('Failed to save caregiver', 'error');
    }
});

// ============ BOOKING MANAGEMENT ============

async function loadBookings() {
    try {
        allBookings = await apiCall('/admin/bookings');
        displayBookings();
    } catch (error) {
        console.error('Load bookings error:', error);
        showToast('Failed to load bookings', 'error');
    }
}

function displayBookings() {
    const searchInput = document.getElementById('bookingSearch');
    const search = searchInput?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('bookingStatusFilter')?.value || 'all';
    
    let filtered = allBookings.filter(b => 
        b.caregiverName && b.caregiverName.toLowerCase().includes(search)
    );
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    const tbody = document.getElementById('bookingsTable');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;">No bookings found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(b => `
        <tr>
            <td>${b.bookingId || b._id.slice(-6)}</td>
            <td><strong>${escapeHtml(b.caregiverName || 'Unknown')}</strong></td>
            <td>${b.userId?.name || 'User'}</td>
            <td>${new Date(b.date).toLocaleDateString()}</td>
            <td><strong>$${b.totalAmount || 0}</strong></td>
            <td><span class="status-badge status-${(b.status || 'Pending').toLowerCase()}">${b.status || 'Pending'}</span></td>
            <td>
                <button class="btn-view" onclick="openBookingStatusModal('${b._id}', '${b.status || 'Pending'}')">Update</button>
                <button class="btn-delete" onclick="deleteBooking('${b._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openBookingStatusModal(id, currentStatus) {
    document.getElementById('updateBookingId').value = id;
    document.getElementById('updateBookingStatus').value = currentStatus;
    document.getElementById('bookingStatusModal').style.display = 'flex';
}

function closeBookingStatusModal() {
    document.getElementById('bookingStatusModal').style.display = 'none';
}

async function updateBookingStatus() {
    const id = document.getElementById('updateBookingId').value;
    const status = document.getElementById('updateBookingStatus').value;
    
    try {
        await apiCall(`/admin/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
        showToast(`✅ Booking status updated to ${status}`);
        closeBookingStatusModal();
        await loadBookings();
        await loadDashboard();
    } catch (error) {
        showToast('Failed to update booking status', 'error');
    }
}

async function deleteBooking(id) {
    if (confirm('Delete this booking permanently?')) {
        try {
            await apiCall(`/admin/bookings/${id}`, { method: 'DELETE' });
            showToast('🗑️ Booking deleted successfully');
            await loadBookings();
            await loadDashboard();
        } catch (error) {
            showToast('Failed to delete booking', 'error');
        }
    }
}

// ============ USER MANAGEMENT ============

async function loadUsers() {
    try {
        allUsers = await apiCall('/admin/users');
        displayUsers();
    } catch (error) {
        console.error('Load users error:', error);
        showToast('Failed to load users', 'error');
    }
}

function displayUsers() {
    const searchInput = document.getElementById('userSearch');
    const search = searchInput?.value.toLowerCase() || '';
    
    const filtered = allUsers.filter(u => 
        u.name.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search)
    );
    
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(u => `
        <tr>
            <td><strong>${escapeHtml(u.name)}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td><span style="background:#e0e7ff; padding:0.25rem 0.75rem; border-radius:20px;">${u.role || 'family'}</span></td>
            <td>${u.phone || '-'}</td>
            <td>${u.isActive !== false ? '✅ Active' : '❌ Inactive'}</td>
            <td><button class="btn-delete" onclick="deleteUser('${u._id}')">Delete</button></td>
        </tr>
    `).join('');
}

async function deleteUser(id) {
    if (confirm('⚠️ Delete this user permanently? This will also delete their bookings.')) {
        try {
            await apiCall(`/admin/users/${id}`, { method: 'DELETE' });
            showToast('🗑️ User deleted successfully');
            await loadUsers();
            await loadDashboard();
        } catch (error) {
            showToast('Failed to delete user', 'error');
        }
    }
}

// ============ SEARCH EVENT LISTENERS ============

document.getElementById('caregiverSearch')?.addEventListener('input', () => displayCaregivers());
document.getElementById('bookingSearch')?.addEventListener('input', () => displayBookings());
document.getElementById('userSearch')?.addEventListener('input', () => displayUsers());
document.getElementById('bookingStatusFilter')?.addEventListener('change', () => displayBookings());

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', async () => {
    const token = getToken();
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        // Verify admin status
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'admin') {
            window.location.href = '/dashboard.html';
            return;
        }
        
        // Load dashboard
        await loadDashboard();
    } catch (error) {
        console.error('Initialization error:', error);
        window.location.href = '/login.html';
    }
});