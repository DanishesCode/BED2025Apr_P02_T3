// Frontend Signup Handler
class SignupHandler {
    constructor() {
        this.form = document.getElementById('signupForm');
        this.nameInput = document.getElementById('name');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.dobInput = document.getElementById('dob');
        this.nameError = document.getElementById('nameError');
        this.emailError = document.getElementById('emailError');
        this.passwordError = document.getElementById('passwordError');
        this.confirmPasswordError = document.getElementById('confirmPasswordError');
        this.dobError = document.getElementById('dobError');
        this.messageDiv = document.getElementById('message');
        this.signupBtn = this.form?.querySelector('.signup-btn');
        
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.nameInput.addEventListener('blur', () => this.validateName());
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        this.confirmPasswordInput.addEventListener('blur', () => this.validateConfirmPassword());
        this.dobInput.addEventListener('blur', () => this.validateDob());
        
        // Clear validation on input
        this.nameInput.addEventListener('input', () => this.clearFieldValidation('name'));
        this.emailInput.addEventListener('input', () => this.clearFieldValidation('email'));
        this.passwordInput.addEventListener('input', () => this.clearFieldValidation('password'));
        this.confirmPasswordInput.addEventListener('input', () => this.clearFieldValidation('confirmPassword'));
        this.dobInput.addEventListener('input', () => this.clearFieldValidation('dob'));
    }

    validateName() {
        const name = this.nameInput.value.trim();
        if (!name) {
            this.showError(this.nameError, 'Name is required');
            return false;
        } else if (name.length < 2) {
            this.showError(this.nameError, 'Name must be at least 2 characters');
            return false;
        } else {
            this.hideError(this.nameError);
            return true;
        }
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        if (!email) {
            this.showError(this.emailError, 'Email is required');
            return false;
        } else if (!this.isValidEmail(email)) {
            this.showError(this.emailError, 'Please enter a valid email address');
            return false;
        } else {
            this.hideError(this.emailError);
            return true;
        }
    }

    validatePassword() {
        const password = this.passwordInput.value;
        if (!password) {
            this.showError(this.passwordError, 'Password is required');
            return false;
        } else if (password.length < 6) {
            this.showError(this.passwordError, 'Password must be at least 6 characters');
            return false;
        } else {
            this.hideError(this.passwordError);
            return true;
        }
    }

    validateConfirmPassword() {
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        
        if (!confirmPassword) {
            this.showError(this.confirmPasswordError, 'Please confirm your password');
            return false;
        } else if (password !== confirmPassword) {
            this.showError(this.confirmPasswordError, 'Passwords do not match');
            return false;
        } else {
            this.hideError(this.confirmPasswordError);
            return true;
        }
    }

    validateDob() {
        const dob = this.dobInput.value;
        if (!dob) {
            this.showError(this.dobError, 'Date of birth is required');
            return false;
        } else {
            const today = new Date();
            const birthDate = new Date(dob);
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < 13) {
                this.showError(this.dobError, 'You must be at least 13 years old');
                return false;
            } else {
                this.hideError(this.dobError);
                return true;
            }
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
        if (errorElement && errorElement.classList.contains('show')) {
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

        // Clear previous errors
        this.clearValidation(this.nameError);
        this.clearValidation(this.emailError);
        this.clearValidation(this.passwordError);
        this.clearValidation(this.confirmPasswordError);
        this.clearValidation(this.dobError);

        // Validate all fields
        const isNameValid = this.validateName();
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        const isConfirmPasswordValid = this.validateConfirmPassword();
        const isDobValid = this.validateDob();

        if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isDobValid) {
            return;
        }

        await this.submitSignup();
    }

    async submitSignup() {
        this.setLoading(true);

        try {
            const userData = {
                name: this.nameInput.value.trim(),
                email: this.emailInput.value.trim(),
                password: this.passwordInput.value,
                dob: this.dobInput.value
            };

            console.log('Attempting signup with:', { ...userData, password: '***' });

            const response = await fetch('http://127.0.0.1:3000/auth/signup', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // Check if response is ok
            if (!response.ok) {
                // Try to get the error message from the backend
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.errors) {
                        errorMsg = errorData.errors.join(', ');
                    } else if (errorData && errorData.message) {
                        errorMsg = errorData.message;
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
                throw new Error(errorMsg);
            }

            // Get response text first
            const responseText = await response.text();
            console.log('Raw response text:', responseText);

            // Try to parse JSON
            let result;
            try {
                result = JSON.parse(responseText);
                console.log('Parsed JSON result:', result);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text that failed to parse:', responseText);
                this.showMessage('Server returned invalid response. Please try again.', 'error');
                return;
            }

            if (result.success) {
                this.showMessage('Account created successfully! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '/public/login/login.html';
                }, 2000);
            } else {
                this.showMessage(result.message || 'Failed to create account.', 'error');
                
                // Handle specific error cases
                if (result.errors && Array.isArray(result.errors)) {
                    result.errors.forEach(error => {
                        if (error.includes('name')) {
                            this.showError(this.nameError, error);
                        } else if (error.includes('email')) {
                            this.showError(this.emailError, error);
                        } else if (error.includes('password')) {
                            this.showError(this.passwordError, error);
                        } else if (error.includes('dob')) {
                            this.showError(this.dobError, error);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        this.signupBtn.disabled = isLoading;
        this.signupBtn.textContent = isLoading ? 'Creating Account...' : 'Create Account';
    }
}

// Initialize signup handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupHandler();
}); 