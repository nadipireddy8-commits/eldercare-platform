// Authentication Functions

async function login(email, password) {
    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.token) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showToast('Login successful! Welcome back!');
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    } catch (error) {
        showToast(error.message || 'Login failed. Please check your credentials.');
        return false;
    }
}

async function register(name, email, password, role = 'family') {
    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role })
        });
        
        showToast('Registration successful! Please login.');
        window.location.href = 'login.html';
        return true;
    } catch (error) {
        showToast(error.message || 'Registration failed. Please try again.');
        return false;
    }
}

function logout() {
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
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        
        // Update UI based on auth status
        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        const dashboardLink = document.getElementById('dashboardLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginNav = document.getElementById('loginNav');
        const registerNav = document.getElementById('registerNav');
        const dashboardNav = document.getElementById('dashboardNav');
        const logoutNavBtn = document.getElementById('logoutNavBtn');
        
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        if (loginNav) loginNav.style.display = 'none';
        if (registerNav) registerNav.style.display = 'none';
        if (dashboardNav) dashboardNav.style.display = 'inline-block';
        if (logoutNavBtn) logoutNavBtn.style.display = 'inline-block';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
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