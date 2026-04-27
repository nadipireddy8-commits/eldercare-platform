// frontend/js/api.js - Complete Fixed Version

// API Configuration
const API_BASE_URL = 'http://localhost:5001/api';

// Global state
let currentUser = null;
let authToken = localStorage.getItem('token');

// Try to load user from localStorage
try {
    const savedUser = localStorage.getItem('user');
    if (savedUser && authToken) {
        currentUser = JSON.parse(savedUser);
        console.log('Loaded user from localStorage:', currentUser);
    }
} catch (e) {
    console.error('Error loading user from localStorage:', e);
}

// API Helper Function
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    console.log(`API Call: ${options.method || 'GET'} ${url}`);
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            console.log('Token expired or invalid');
            logout();
            throw new Error('Session expired. Please login again.');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Request failed');
        }
        
        console.log(`API Response:`, data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast && toast.remove) toast.remove();
    }, 3000);
}

// Authentication Functions
async function login(email, password) {
    try {
        console.log('Attempting login for:', email);
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.token) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            console.log('Login successful:', currentUser);
            showToast('Login successful! Welcome back!');
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed. Please check your credentials.');
        return false;
    }
}

async function register(name, email, password, role = 'family') {
    try {
        console.log('Attempting registration for:', email);
        await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role })
        });
        
        showToast('Registration successful! Please login.');
        window.location.href = 'login.html';
        return true;
    } catch (error) {
        console.error('Registration error:', error);
        showToast(error.message || 'Registration failed. Please try again.');
        return false;
    }
}

function logout() {
    console.log('Logging out user:', currentUser?.name);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    showToast('Logged out successfully');
    window.location.href = 'index.html';
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Checking auth status - Token exists:', !!token);
    
    if (token && user) {
        authToken = token;
        try {
            currentUser = JSON.parse(user);
            console.log('User authenticated:', currentUser.name);
        } catch (e) {
            console.error('Error parsing user:', e);
        }
        
        // Update UI based on auth status
        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        const dashboardLink = document.getElementById('dashboardLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginNav = document.getElementById('loginNav');
        const registerNav = document.getElementById('registerNav');
        const dashboardNav = document.getElementById('dashboardNav');
        const logoutNavBtn = document.getElementById('logoutNavBtn');
        const bookingsNav = document.getElementById('bookingsNav');
        const profileNav = document.getElementById('profileNav');
        const bookingsLink = document.getElementById('bookingsLink');
        
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (bookingsLink) bookingsLink.style.display = 'inline-block';
        
        if (loginNav) loginNav.style.display = 'none';
        if (registerNav) registerNav.style.display = 'none';
        if (dashboardNav) dashboardNav.style.display = 'inline-block';
        if (logoutNavBtn) logoutNavBtn.style.display = 'inline-block';
        if (bookingsNav) bookingsNav.style.display = 'inline-block';
        if (profileNav) profileNav.style.display = 'inline-block';
    } else {
        console.log('User not authenticated');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, setting up event listeners');
    
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
                showToast('Passwords do not match!');
                return;
            }
            
            if (password.length < 6) {
                showToast('Password must be at least 6 characters!');
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