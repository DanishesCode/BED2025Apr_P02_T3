const validator = require('validator');

class ValidationMiddleware {
    static validateSignup(req, res, next) {
        const { name, email, password, dob } = req.body;
        const errors = [];

        // Validate name
        if (!name || typeof name !== 'string') {
            errors.push('Name is required');
        } else if (name.trim().length < 2 || name.trim().length > 100) {
            errors.push('Name must be between 2 and 100 characters');
        }

        // Validate email
        if (!email || typeof email !== 'string') {
            errors.push('Email is required');
        } else if (!validator.isEmail(email) || email.length > 100) {
            errors.push('Please enter a valid email address');
        }

        // Validate password
        if (!password || typeof password !== 'string') {
            errors.push('Password is required');
        } else if (password.length < 6 || password.length > 255) {
            errors.push('Password must be between 6 and 255 characters');
        }

        // Validate date of birth
        if (!dob) {
            errors.push('Date of birth is required');
        } else if (!validator.isDate(dob)) {
            errors.push('Please enter a valid date of birth');
        } else {
            const today = new Date();
            const birthDate = new Date(dob);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (age < 13 || age > 120) {
                errors.push('Age must be between 13 and 120 years');
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        // Sanitize inputs
        req.body.name = name.trim();
        req.body.email = email.trim().toLowerCase();
        
        next();
    }

    static validateLogin(req, res, next) {
        const { email, password } = req.body;
        const errors = [];

        // Validate email
        if (!email || typeof email !== 'string') {
            errors.push('Email is required');
        } else if (!validator.isEmail(email)) {
            errors.push('Please enter a valid email address');
        }

        // Validate password
        if (!password || typeof password !== 'string') {
            errors.push('Password is required');
        } else if (password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        // Sanitize inputs
        req.body.email = email.trim().toLowerCase();
        
        next();
    }

    static validateUpdateProfile(req, res, next) {
        const { name } = req.body;
        const errors = [];

        // Validate name
        if (!name || typeof name !== 'string') {
            errors.push('Name is required');
        } else if (name.trim().length < 2 || name.trim().length > 100) {
            errors.push('Name must be between 2 and 100 characters');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        // Sanitize inputs
        req.body.name = name.trim();
        
        next();
    }

    static sanitizeInput(req, res, next) {
        // Remove any potential HTML/script tags from all string inputs
        function sanitizeObject(obj) {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                    obj[key] = obj[key].replace(/<[^>]*>/g, '');
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        }

        if (req.body) {
            sanitizeObject(req.body);
        }

        next();
    }
}

module.exports = ValidationMiddleware;