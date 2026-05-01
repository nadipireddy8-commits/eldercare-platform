// frontend/js/main.js - Complete with Cancel Functionality

// Global variables
let allCaregivers = [];

// Load and display caregivers
async function loadCaregivers(searchTerm = '', serviceFilter = '', experienceFilter = '') {
    try {
        const caregivers = await apiCall('/caregivers');
        allCaregivers = caregivers;
        
        let filtered = caregivers.filter(caregiver => {
            let matches = true;
            
            if (searchTerm) {
                matches = matches && (caregiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     caregiver.service?.toLowerCase().includes(searchTerm.toLowerCase()));
            }
            
            if (serviceFilter) {
                matches = matches && caregiver.service === serviceFilter;
            }
            
            if (experienceFilter) {
                matches = matches && caregiver.experience >= parseInt(experienceFilter);
            }
            
            return matches;
        });
        
        displayCaregivers(filtered);
    } catch (error) {
        showToast('Failed to load caregivers');
        console.error(error);
    }
}

function displayCaregivers(caregivers, container = null) {
    const targetContainer = container || document.getElementById('caregiversList');
    if (!targetContainer) return;
    
    if (!caregivers || caregivers.length === 0) {
        targetContainer.innerHTML = '<p class="loading">No caregivers found</p>';
        return;
    }
    
    targetContainer.innerHTML = caregivers.map(caregiver => `
        <div class="caregiver-card">
            <h3>${caregiver.name} ${caregiver.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}</h3>
            <div class="service">${caregiver.service || 'General Elder Care'}</div>
            <div class="experience">⭐ ${caregiver.experience || 2}+ years experience</div>
            <p>${caregiver.description || 'Compassionate and experienced caregiver dedicated to providing quality care.'}</p>
            <button class="book-btn" onclick="bookCaregiver('${caregiver._id}')">Book Now</button>
        </div>
    `).join('');
}

// Book Caregiver function
// Book Caregiver - Opens modal instead of immediate booking
async function bookCaregiver(caregiverId) {
    if (!authToken) {
        showToast('Please login to book a caregiver');
        window.location.href = 'login.html';
        return;
    }
    
    if (!currentUser) {
        showToast('Please login to book a caregiver');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Find the caregiver
        const caregiver = allCaregivers.find(c => c._id === caregiverId);
        if (!caregiver) {
            showToast('Caregiver not found');
            return;
        }
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('bookingDate').min = today;
        document.getElementById('bookingDate').value = today;
        
        // Set modal values
        document.getElementById('selectedCaregiverId').value = caregiverId;
        document.getElementById('selectedCaregiverName').value = caregiver.name;
        document.getElementById('modalCaregiverName').value = caregiver.name;
        
        // Update price when duration changes
        const durationSelect = document.getElementById('bookingDuration');
        const updatePrice = () => {
            const duration = parseInt(durationSelect.value);
            const hourlyRate = caregiver.hourlyRate || 25;
            const total = duration * hourlyRate;
            document.getElementById('totalAmount').innerHTML = `$${total}`;
            durationSelect.options[durationSelect.selectedIndex].text = 
                `${duration} hour${duration > 1 ? 's' : ''} - $${total}`;
        };
        
        durationSelect.onchange = updatePrice;
        updatePrice();
        
        // Show modal
        document.getElementById('bookingModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Booking error:', error);
        showToast('Failed to load booking form');
    }
}

// Close booking modal
function closeBookingModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.getElementById('bookingNotes').value = '';
}

// Confirm booking with date, time, duration
async function confirmBooking() {
    const caregiverId = document.getElementById('selectedCaregiverId').value;
    const caregiverName = document.getElementById('selectedCaregiverName').value;
    const bookingDate = document.getElementById('bookingDate').value;
    const timeSlot = document.getElementById('bookingTimeSlot').value;
    const duration = parseInt(document.getElementById('bookingDuration').value);
    const notes = document.getElementById('bookingNotes').value;
    
    // Validation
    if (!bookingDate) {
        showToast('Please select a date');
        return;
    }
    
    if (!timeSlot) {
        showToast('Please select a time slot');
        return;
    }
    
    if (!duration || duration < 1) {
        showToast('Please select duration');
        return;
    }
    
    // Calculate total amount
    const caregiver = allCaregivers.find(c => c._id === caregiverId);
    const hourlyRate = caregiver?.hourlyRate || 25;
    const totalAmount = duration * hourlyRate;
    
    // Close modal
    closeBookingModal();
    
    // Show loading
    showToast('Processing your booking...');
    
    try {
        // Create booking
        const bookingData = {
            caregiverId: caregiverId,
            date: new Date(bookingDate).toISOString(),
            timeSlot: timeSlot,
            duration: duration,
            totalAmount: totalAmount,
            notes: notes || `Booking request for ${caregiverName}`
        };
        
        console.log('Sending booking request:', bookingData);
        
        const result = await apiCall('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
        
        console.log('Booking result:', result);
        
        // Show success modal
        document.getElementById('successModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Booking error:', error);
        showToast('❌ Failed to book caregiver: ' + error.message);
    }
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Close success modal and redirect to bookings
function closeSuccessModalAndRedirect() {
    document.getElementById('successModal').style.display = 'none';
    window.location.href = 'bookings.html';
}
// Cancel booking function
// Cancel booking function - FIXED VERSION
async function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        try {
            showToast('Cancelling booking...');
            
            // Try both possible endpoints
            try {
                await apiCall(`/bookings/${bookingId}/cancel`, {
                    method: 'PUT'
                });
            } catch (e) {
                // If first fails, try alternative endpoint
                await apiCall(`/bookings/${bookingId}`, {
                    method: 'DELETE'
                });
            }
            
            showToast('✅ Booking cancelled successfully');
            // Reload the bookings list
            setTimeout(() => {
                loadUserBookings();
            }, 1000);
            
        } catch (error) {
            console.error('Cancel booking error:', error);
            showToast('❌ Failed to cancel booking: ' + error.message);
        }
    }
}

// Load dashboard data
async function loadDashboardData() {
    if (!currentUser) {
        console.log('No current user found');
        return;
    }
    
    try {
        console.log('Loading dashboard data for user ID:', currentUser._id);
        
        const bookings = await apiCall('/bookings');
        console.log('Bookings from API:', bookings);
        
        const totalBookings = document.getElementById('totalBookings');
        const activeBookings = document.getElementById('activeBookings');
        const completedBookings = document.getElementById('completedBookings');
        
        if (totalBookings) totalBookings.textContent = bookings.length;
        if (activeBookings) activeBookings.textContent = bookings.filter(b => b.status === 'Accepted' || b.status === 'In Progress').length;
        if (completedBookings) completedBookings.textContent = bookings.filter(b => b.status === 'Completed').length;
        
        const recentContainer = document.getElementById('recentBookingsList');
        if (recentContainer) {
            displayBookings(bookings.slice(0, 5), recentContainer);
        }
        
        const caregivers = await apiCall('/caregivers');
        const recommendedContainer = document.getElementById('recommendedCaregivers');
        if (recommendedContainer) {
            displayCaregiversForDashboard(caregivers.slice(0, 3), recommendedContainer);
        }
        
        const userNameSpan = document.getElementById('userName');
        if (userNameSpan && currentUser) {
            userNameSpan.textContent = currentUser.name;
        }
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showToast('Failed to load dashboard data');
    }
}

function displayCaregiversForDashboard(caregivers, container) {
    if (!caregivers || caregivers.length === 0) {
        container.innerHTML = '<p class="loading">No caregivers available</p>';
        return;
    }
    
    container.innerHTML = caregivers.map(caregiver => `
        <div class="caregiver-card">
            <h3>${caregiver.name} ${caregiver.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}</h3>
            <div class="service">${caregiver.service || 'General Elder Care'}</div>
            <div class="experience">⭐ ${caregiver.experience || 2}+ years experience</div>
            <p>${caregiver.description || 'Compassionate and experienced caregiver dedicated to providing quality care.'}</p>
            <button class="book-btn" onclick="bookCaregiver('${caregiver._id}')">Book Now</button>
        </div>
    `).join('');
}

// Display Bookings function with Cancel button
function displayBookings(bookings, container) {
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="no-bookings">
                <p>📋 No bookings found.</p>
                <a href="caregivers.html" class="btn-primary">Book a Caregiver</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = bookings.map(booking => {
        let bookingDate = 'Date pending';
        if (booking.date) {
            try {
                const date = new Date(booking.date);
                bookingDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch(e) {
                bookingDate = booking.date;
            }
        }
        
        const status = booking.status || 'Pending';
        let statusClass = 'status-pending';
        let statusIcon = '⏳';
        
        if (status === 'Accepted') {
            statusClass = 'status-accepted';
            statusIcon = '✅';
        } else if (status === 'In Progress') {
            statusClass = 'status-in-progress';
            statusIcon = '🔄';
        } else if (status === 'Completed') {
            statusClass = 'status-completed';
            statusIcon = '✓';
        } else if (status === 'Cancelled') {
            statusClass = 'status-cancelled';
            statusIcon = '❌';
        }
        
        return `
            <div class="booking-card">
                <div class="booking-info">
                    <h4>Booking #${booking._id ? booking._id.slice(-6) : 'New'}</h4>
                    <p><strong>👤 Caregiver:</strong> ${booking.caregiverName || 'Loading...'}</p>
                    <p><strong>📅 Date:</strong> ${bookingDate}</p>
                    <p><strong>⏰ Time:</strong> ${booking.timeSlot || 'Flexible'}</p>
                    <p><strong>⏱️ Duration:</strong> ${booking.duration || 2} hours</p>
                    ${booking.notes ? `<p><strong>📝 Notes:</strong> ${booking.notes}</p>` : ''}
                </div>
                <div class="booking-actions">
                    <div class="booking-status-container">
                        <span class="booking-status ${statusClass}">
                            ${statusIcon} ${status}
                        </span>
                    </div>
                    ${booking.status === 'Pending' ? `<button onclick="cancelBooking('${booking._id}')" class="btn-cancel">Cancel Booking</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Load user bookings
async function loadUserBookings(statusFilter = 'all') {
    if (!currentUser) {
        console.log('No current user found');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        console.log('Loading bookings for user ID:', currentUser._id);
        
        const bookings = await apiCall('/bookings');
        console.log('All bookings from API:', bookings);
        
        let filteredBookings = bookings;
        if (statusFilter !== 'all') {
            filteredBookings = bookings.filter(b => b.status === statusFilter);
        }
        
        const container = document.getElementById('bookingsList');
        if (container) {
            displayBookings(filteredBookings, container);
        }
        
    } catch (error) {
        console.error('Failed to load bookings:', error);
        const container = document.getElementById('bookingsList');
        if (container) {
            container.innerHTML = '<p class="error">Failed to load bookings. Please try again.</p>';
        }
        showToast('Failed to load bookings');
    }
}

// Load user profile
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const patient = await apiCall(`/patients/${currentUser._id}`);
        
        const fullName = document.getElementById('fullName');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const address = document.getElementById('address');
        const emergencyContact = document.getElementById('emergencyContact');
        const medicalInfo = document.getElementById('medicalInfo');
        
        if (fullName) fullName.value = (patient && patient.name) || currentUser.name;
        if (email) email.value = (patient && patient.email) || currentUser.email;
        if (phone) phone.value = (patient && patient.phone) || '';
        if (address) address.value = (patient && patient.address) || '';
        if (emergencyContact) emergencyContact.value = (patient && patient.emergencyContact) || '';
        if (medicalInfo) medicalInfo.value = (patient && patient.medicalInfo) || '';
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

// Save user profile
async function saveUserProfile(e) {
    if (e) e.preventDefault();
    
    const profileData = {
        userId: currentUser._id,
        name: document.getElementById('fullName')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        address: document.getElementById('address')?.value || '',
        emergencyContact: document.getElementById('emergencyContact')?.value || '',
        medicalInfo: document.getElementById('medicalInfo')?.value || ''
    };
    
    try {
        await apiCall('/patients', {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
        showToast('Profile saved successfully!');
    } catch (error) {
        console.error('Save profile error:', error);
        showToast('Failed to save profile');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, current user:', currentUser);
    
    if (window.location.pathname.includes('dashboard.html')) {
        if (currentUser) {
            loadDashboardData();
        } else {
            window.location.href = 'login.html';
        }
    }
    
    if (window.location.pathname.includes('bookings.html')) {
        if (currentUser) {
            loadUserBookings();
            
            const tabBtns = document.querySelectorAll('.tab-btn');
            if (tabBtns.length > 0) {
                tabBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        tabBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        loadUserBookings(btn.dataset.status);
                    });
                });
            }
        } else {
            window.location.href = 'login.html';
        }
    }
    
    if (window.location.pathname.includes('caregivers.html')) {
        loadCaregivers();
        
        const searchInput = document.getElementById('searchInput');
        const serviceFilter = document.getElementById('serviceFilter');
        const experienceFilter = document.getElementById('experienceFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                loadCaregivers(searchInput.value, serviceFilter?.value || '', experienceFilter?.value || '');
            });
        }
        
        if (serviceFilter) {
            serviceFilter.addEventListener('change', () => {
                loadCaregivers(searchInput?.value || '', serviceFilter.value, experienceFilter?.value || '');
            });
        }
        
        if (experienceFilter) {
            experienceFilter.addEventListener('change', () => {
                loadCaregivers(searchInput?.value || '', serviceFilter?.value || '', experienceFilter.value);
            });
        }
    }
    
    if (window.location.pathname.includes('profile.html')) {
        if (currentUser) {
            loadUserProfile();
            
            const profileForm = document.getElementById('profileForm');
            if (profileForm) {
                profileForm.addEventListener('submit', saveUserProfile);
            }
        } else {
            window.location.href = 'login.html';
        }
    }
});