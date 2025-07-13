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

            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Include cookies
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                // Store token in localStorage
                if (result.token) {
                    localStorage.setItem('authToken', result.token);
                    console.log('Token stored in localStorage:', result.token);
                }
                
                // Store user info
                if (result.user) {
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    console.log('User info stored in localStorage:', result.user);
                }

                this.showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    // Redirect to main page or dashboard
                    window.location.href = 'http://localhost:3000/';
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
            fetch('http://localhost:3000/user/profile', {

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
                    window.location.href = 'http://localhost:3000/';
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

// Carousel functionality
class Carousel {
    constructor() {
        this.images = document.querySelectorAll('.carousel-image');
        this.currentIndex = 0;
        this.totalImages = this.images.length;
        this.interval = null;
        
        if (this.totalImages > 0) {
            this.init();
        }
    }

    init() {
        console.log('Carousel initialized with', this.totalImages, 'images');
        this.showImage(this.currentIndex);
        this.startAutoPlay();
    }

    showImage(index) {
        this.images.forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
        console.log('Showing image', index);
    }

    nextImage() {
        this.currentIndex = (this.currentIndex + 1) % this.totalImages;
        this.showImage(this.currentIndex);
    }

    startAutoPlay() {
        this.interval = setInterval(() => {
            this.nextImage();
        }, 5000);
    }

    stopAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

// Friendly quotes functionality
class QuoteRotator {
    constructor() {
        this.quotes = [
            "A smile is the best accessory you can wear today!",
            "Need help? We're always here for you.",
            "Take your time, there's no rush.",
            "Your well-being is our priority.",
            "If you need assistance, just ask!"
        ];
        this.currentIndex = 0;
        this.quoteDiv = document.getElementById('friendlyQuote');
        this.interval = null;
        
        if (this.quoteDiv) {
            this.init();
        }
    }

    init() {
        this.showQuote(this.currentIndex);
        this.startRotation();
    }

    showQuote(index) {
        if (this.quoteDiv) {
            this.quoteDiv.textContent = this.quotes[index];
        }
    }

    nextQuote() {
        this.currentIndex = (this.currentIndex + 1) % this.quotes.length;
        this.showQuote(this.currentIndex);
    }

    startRotation() {
        this.interval = setInterval(() => {
            this.nextQuote();
        }, 6000);
    }

    stopRotation() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

// Ripple effect for buttons
class RippleEffect {
    constructor() {
        this.loginBtn = document.querySelector('.login-btn');
        if (this.loginBtn) {
            this.init();
        }
    }

    init() {
        this.loginBtn.addEventListener('click', (e) => this.createRipple(e));
    }

    createRipple(e) {
        const circle = document.createElement('span');
        circle.classList.add('ripple');
        const rect = this.loginBtn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        circle.style.width = circle.style.height = size + 'px';
        circle.style.left = x + 'px';
        circle.style.top = y + 'px';
        
        this.loginBtn.appendChild(circle);
        
        setTimeout(() => {
            circle.remove();
        }, 600);
    }
}

// Fade-in/slide-up animation on page load
window.addEventListener('DOMContentLoaded', () => {
  const loginImageSection = document.querySelector('.login-image-section');
  const loginFormSection = document.querySelector('.login-form-section');
  
  if (loginImageSection) {
    loginImageSection.style.opacity = '1';
    loginImageSection.style.transform = 'translateY(0)';
  }
  
  if (loginFormSection) {
    loginFormSection.style.opacity = '1';
    loginFormSection.style.transform = 'translateY(0)';
  }
});

// Ripple effect for login button
const loginBtn = document.querySelector('.login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', function(e) {
    const circle = document.createElement('span');
    circle.classList.add('ripple');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    circle.style.width = circle.style.height = size + 'px';
    circle.style.left = x + 'px';
    circle.style.top = y + 'px';
    this.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing components...');
    
    // Initialize login handler
    new LoginHandler();
    
    // Initialize carousel
    new Carousel();
    
    // Initialize quote rotator
    new QuoteRotator();
    
    // Initialize ripple effect
    new RippleEffect();
    
    console.log('All components initialized');
});