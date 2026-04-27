// Admin Panel JavaScript

let currentCaregivers = [];

// Load all caregivers
async function loadCaregivers() {
    try {
        const caregivers = await apiCall('/admin/caregivers');
        currentCaregivers = caregivers;
        displayCaregivers(caregivers);
    } catch (error) {
        console.error('Failed to load caregivers:', error);
        showToast('Failed to load caregivers');
    }
}

function displayCaregivers(caregivers) {
    const tbody = document.getElementById('caregiversTableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtered = caregivers.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        c.service.toLowerCase().includes(searchTerm)
    );
    
    tbody.innerHTML = filtered.map(caregiver => `
        <tr>
            <td>${caregiver.name} ${caregiver.verified ? '✓' : ''}</td>
            <td>${caregiver.service}</td>
            <td>${caregiver.experience} years</td>
            <td>${caregiver.verified ? 'Verified' : 'Pending'}</td>
            <td>${caregiver.rating || 0} ★</td>
            <td>
                ${!caregiver.verified ? `<button class="btn-verify" onclick="verifyCaregiver('${caregiver._id}')">Verify</button>` : ''}
                <button class="btn-edit" onclick="editCaregiver('${caregiver._id}')">Edit</button>
                <button class="btn-delete" onclick="deleteCaregiver('${caregiver._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function verifyCaregiver(id) {
    if (confirm('Verify this caregiver?')) {
        try {
            await apiCall(`/admin/caregivers/${id}/verify`, { method: 'PUT' });
            showToast('Caregiver verified successfully');
            loadCaregivers();
        } catch (error) {
            showToast('Failed to verify caregiver');
        }
    }
}

async function deleteCaregiver(id) {
    if (confirm('Are you sure you want to delete this caregiver?')) {
        try {
            await apiCall(`/admin/caregivers/${id}`, { method: 'DELETE' });
            showToast('Caregiver deleted successfully');
            loadCaregivers();
        } catch (error) {
            showToast('Failed to delete caregiver');
        }
    }
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Caregiver';
    document.getElementById('caregiverForm').reset();
    document.getElementById('caregiverId').value = '';
    document.getElementById('caregiverModal').style.display = 'flex';
}

function editCaregiver(id) {
    const caregiver = currentCaregivers.find(c => c._id === id);
    if (caregiver) {
        document.getElementById('modalTitle').textContent = 'Edit Caregiver';
        document.getElementById('caregiverId').value = caregiver._id;
        document.getElementById('name').value = caregiver.name;
        document.getElementById('service').value = caregiver.service;
        document.getElementById('experience').value = caregiver.experience;
        document.getElementById('hourlyRate').value = caregiver.hourlyRate || 25;
        document.getElementById('description').value = caregiver.description || '';
        document.getElementById('phone').value = caregiver.phone || '';
        document.getElementById('email').value = caregiver.email || '';
        document.getElementById('caregiverModal').style.display = 'flex';
    }
}

function closeModal() {
    document.getElementById('caregiverModal').style.display = 'none';
}

// Save caregiver
document.getElementById('caregiverForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('caregiverId').value;
    const data = {
        name: document.getElementById('name').value,
        service: document.getElementById('service').value,
        experience: parseInt(document.getElementById('experience').value),
        hourlyRate: parseInt(document.getElementById('hourlyRate').value),
        description: document.getElementById('description').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value
    };
    
    try {
        if (id) {
            await apiCall(`/admin/caregivers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            showToast('Caregiver updated successfully');
        } else {
            await apiCall('/admin/caregivers', { method: 'POST', body: JSON.stringify(data) });
            showToast('Caregiver added successfully');
        }
        closeModal();
        loadCaregivers();
    } catch (error) {
        showToast('Failed to save caregiver');
    }
});

// Search
document.getElementById('searchInput')?.addEventListener('input', () => {
    displayCaregivers(currentCaregivers);
});

// Load users for admin
async function loadUsers() {
    try {
        const users = await apiCall('/admin/users');
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${user.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                        <button class="btn-edit" onclick="editUser('${user._id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteUser('${user._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function deleteUser(id) {
    if (confirm('Delete this user?')) {
        try {
            await apiCall(`/admin/users/${id}`, { method: 'DELETE' });
            showToast('User deleted');
            loadUsers();
        } catch (error) {
            showToast('Failed to delete user');
        }
    }
}

// Load bookings for admin
async function loadBookings() {
    try {
        const bookings = await apiCall('/admin/bookings');
        const tbody = document.getElementById('bookingsTableBody');
        if (tbody) {
            tbody.innerHTML = bookings.map(booking => `
                <tr>
                    <td>${booking.bookingId || booking._id.slice(-6)}</td>
                    <td>${booking.caregiverName}</td>
                    <td>${new Date(booking.date).toLocaleDateString()}</td>
                    <td>$${booking.totalAmount || 0}</td>
                    <td>
                        <select onchange="updateBookingStatus('${booking._id}', this.value)" class="status-${booking.status.toLowerCase()}">
                            <option value="Pending" ${booking.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Accepted" ${booking.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                            <option value="In Progress" ${booking.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${booking.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${booking.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn-delete" onclick="deleteBooking('${booking._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load bookings:', error);
    }
}

async function updateBookingStatus(id, status) {
    try {
        await apiCall(`/admin/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
        showToast('Booking status updated');
    } catch (error) {
        showToast('Failed to update status');
    }
}

async function deleteBooking(id) {
    if (confirm('Delete this booking?')) {
        try {
            await apiCall(`/admin/bookings/${id}`, { method: 'DELETE' });
            showToast('Booking deleted');
            loadBookings();
        } catch (error) {
            showToast('Failed to delete booking');
        }
    }
}

// Initialize based on page
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser?.role !== 'admin') {
        window.location.href = '../login.html';
    }
    
    const path = window.location.pathname;
    if (path.includes('admin-caregivers.html')) {
        loadCaregivers();
    } else if (path.includes('admin-users.html')) {
        loadUsers();
    } else if (path.includes('admin-bookings.html')) {
        loadBookings();
    }
});