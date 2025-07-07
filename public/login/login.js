// Frontend Login Handler
class LoginHandler {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.emailError = document.getElementById('emailError');
        this.passwordError = document.getElementById('passwordError');
        this.messageDiv = document.getElementById('message');
        this.loginBtn = this.form?.querySelector('.login-btn');
        
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.attachEventListeners();
        this.checkExistingAuth();
    }

    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        
        // Clear validation on input
        this.emailInput.addEventListener('input', () => this.clearFieldValidation('email'));
        this.passwordInput.addEventListener('input', () => this.clearFieldValidation('password'));
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        if (email && !this.isValidEmail(email)) {
            this.showError(this.emailError, 'Please enter a valid email address');
            return false;
        } else if (email) {
            this.hideError(this.emailError);
            return true;
        } else {
            this.clearValidation(this.emailError);
            return false;
        }
    }

    validatePassword() {
        const password = this.passwordInput.value;
        if (password && password.length < 6) {
            this.showError(this.passwordError, 'Password must be at least 6 characters');
            return false;
        } else if (password) {
            this.hideError(this.passwordError);
            return true;
        } else {
            this.clearValidation(this.passwordError);
            return false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 100;
    }

    showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
        element.previousElementSibling.classList.add('error');
        element.previousElementSibling.classList.remove('success');
    }

    hideError(element) {
        element.textContent = '';
        element.classList.remove('show');
        element.previousElementSibling.classList.remove('error');
        element.previousElementSibling.classList.add('success');
    }

    clearValidation(element) {
        element.textContent = '';
        element.classList.remove('show');
        element.previousElementSibling.classList.remove('error', 'success');
    }

    clearFieldValidation(fieldName) {
        const errorElement = document.getElementById(fieldName + 'Error');
        if (errorElement.classList.contains('show')) {
            this.clearValidation(errorElement);
        }
    }

    showMessage(message, type) {
        this.messageDiv.textContent = message;
        this.messageDiv.className = `message show ${type}`;
        setTimeout(() => {
            this.messageDiv.classList.remove('show');
        }, 4000);
    }

    async handleSubmit(e) {
        e.preventDefault();

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        // Clear previous errors
        this.clearValidation(this.emailError);
        this.clearValidation(this.passwordError);

        let isValid = true;

        if (!email) {
            this.showError(this.emailError, 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showError(this.emailError, 'Please enter a valid email address');
            isValid = false;
        }

        if (!password) {
            this.showError(this.passwordError, 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showError(this.passwordError, 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!isValid) return;

        await this.submitLogin(email, password);
    }

    async submitLogin(email, password) {
        this.setLoading(true);

        try {
<<<<<<< HEAD
            const response = await fetch('/api/login', {
=======
            const response = await fetch('http://localhost:3000/auth/login', {
>>>>>>> 6d3e09573ef1eb153e882d9bcea4c9c848e53269
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Include cookies
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
<<<<<<< HEAD
                // Store token in localStorage if provided
                if (result.token) {
                    localStorage.setItem('authToken', result.token);
=======
                // Store token in localStorage
                if (result.token) {
                    localStorage.setItem('authToken', result.token);
                    console.log('Token stored in localStorage:', result.token);
>>>>>>> 6d3e09573ef1eb153e882d9bcea4c9c848e53269
                }
                
                // Store user info
                if (result.user) {
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
<<<<<<< HEAD
=======
                    console.log('User info stored in localStorage:', result.user);
>>>>>>> 6d3e09573ef1eb153e882d9bcea4c9c848e53269
                }

                this.showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
<<<<<<< HEAD
=======
                    // Redirect to main page or dashboard
>>>>>>> 6d3e09573ef1eb153e882d9bcea4c9c848e53269
                    window.location.href = '/public/index.html';
                }, 1500);
            } else {
                this.showMessage(result.message || 'Invalid email or password.', 'error');
                
                // Handle specific error cases
                if (result.errors && Array.isArray(result.errors)) {
                    result.errors.forEach(error => {
                        if (error.includes('email')) {
                            this.showError(this.emailError, error);
                        } else if (error.includes('password')) {
                            this.showError(this.passwordError, error);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        this.loginBtn.disabled = isLoading;
        this.loginBtn.textContent = isLoading ? 'Logging in...' : 'Login';
    }

    checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            // Validate token with server
<<<<<<< HEAD
            fetch('/api/profile', {
=======
            fetch('http://localhost:3000/user/profile', {
>>>>>>> 6d3e09573ef1eb153e882d9bcea4c9c848e53269
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // User is already authenticated, redirect
                    window.location.href = '/public/index.html';
                } else {
                    // Token is invalid, clear it
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                }
            })
            .catch(() => {
                // Network error, clear token
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
            });
        }
    }
}

// Initialize login handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginHandler();
});