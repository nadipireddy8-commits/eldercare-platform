// frontend/js/auth.js
// Authentication Functions

// Use the global API_BASE_URL from api.js (don't redeclare)

// Helper function to show errors
function showErrorMessage(message) {
    const errorDiv = document.getElementById('errorMsg');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

function showSuccessMessage(message) {
    const successDiv = document.getElementById('successMsg');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

// Login function (ONLY HERE, NOT IN api.js)
async function login(email, password) {
    try {
        console.log('Attempting login for:', email);
        
        // Use the global API_BASE_URL from api.js
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            console.log('Login successful! Role:', data.user.role);
            showSuccessMessage('Login successful! Welcome back!');
            
            // Role-based redirect
            if (data.user.role === 'admin') {
                window.location.href = '/admin/admin-dashboard.html';
            } else if (data.user.role === 'caregiver') {
                window.location.href = '/caregiver-dashboard.html';
            } else {
                window.location.href = '/dashboard.html';
            }
            return true;
        } else {
            showErrorMessage(data.message || 'Invalid credentials. Please try again.');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showErrorMessage('Connection error. Please check if backend is running.');
        return false;
    }
}

// Register function
async function register(name, email, password, role = 'family') {
    try {
        console.log('Attempting registration for:', email);
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage('Registration successful! Please login.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return true;
        } else {
            showErrorMessage(data.message || 'Registration failed. Please try again.');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showErrorMessage('Connection error. Please try again.');
        return false;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// Check authentication status and update UI
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    let user = {};
    
    try {
        user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
        console.error('Error parsing user:', e);
    }
    
    if (token && user && user.name) {
        // Update navigation based on role
        const loginLinks = document.querySelectorAll('#loginLink, #loginNav');
        const registerLinks = document.querySelectorAll('#registerLink, #registerNav');
        const dashboardLinks = document.querySelectorAll('#dashboardLink, #dashboardNav');
        const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutNavBtn');
        const bookingsLinks = document.querySelectorAll('#bookingsLink, #bookingsNav');
        const profileLinks = document.querySelectorAll('#profileLink, #profileNav');
        
        loginLinks.forEach(link => {
            if (link) link.style.display = 'none';
        });
        registerLinks.forEach(link => {
            if (link) link.style.display = 'none';
        });
        dashboardLinks.forEach(link => {
            if (link) link.style.display = 'inline-block';
        });
        logoutBtns.forEach(btn => {
            if (btn) btn.style.display = 'inline-block';
        });
        bookingsLinks.forEach(link => {
            if (link) link.style.display = 'inline-block';
        });
        profileLinks.forEach(link => {
            if (link) link.style.display = 'inline-block';
        });
        
        // Add caregiver specific navigation if role is caregiver
        if (user.role === 'caregiver') {
            const nav = document.querySelector('nav');
            if (nav && !document.getElementById('caregiverNav')) {
                const caregiverLink = document.createElement('a');
                caregiverLink.id = 'caregiverNav';
                caregiverLink.href = '/caregiver-dashboard.html';
                caregiverLink.textContent = '👩‍⚕️ Caregiver Portal';
                nav.appendChild(caregiverLink);
            }
        }
        
        return true;
    }
    return false;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth.js loaded');
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await login(email, password);
        });
    }
    
    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const role = document.getElementById('role')?.value || 'family';
            
            if (password !== confirmPassword) {
                showErrorMessage('Passwords do not match!');
                return;
            }
            
            if (password.length < 6) {
                showErrorMessage('Password must be at least 6 characters!');
                return;
            }
            
            await register(name, email, password, role);
        });
    }
    
    // Logout button handlers
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutNavBtn');
    logoutBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', logout);
        }
    });
    
    // Check auth status on page load
    checkAuthStatus();
});