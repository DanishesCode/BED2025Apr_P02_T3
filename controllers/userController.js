const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');

class UserController {
    static async signup(req, res) {
        try {
            const { name, email, password, dob } = req.body;

            // Check for required fields
            if (!name || !email || !password || !dob) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields (name, email, password, dob) are required.',
                    error: 'MISSING_REQUIRED_FIELDS'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address.',
                    error: 'INVALID_EMAIL_FORMAT'
                });
            }

            // Validate password strength
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters long.',
                    error: 'WEAK_PASSWORD'
                });
            }

            // Validate date format
            if (isNaN(Date.parse(dob))) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid date of birth.',
                    error: 'INVALID_DATE_FORMAT'
                });
            }

            // Validation is handled by middleware
            const result = await UserModel.createUser({
                name,
                email,
                password,
                dob
            });

            if (!result.success) {
                if (result.message && result.message.includes('duplicate')) {
                    return res.status(409).json({
                        success: false,
                        message: 'An account with this email already exists.',
                        error: 'EMAIL_ALREADY_EXISTS'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: result.message || 'Failed to create user account.',
                    error: 'USER_CREATION_FAILED'
                });
            }

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: {
                    id: result.user.userId,
                    name: result.user.name,
                    email: result.user.email
                }
            });
        } catch (error) {
            console.error('Signup error:', error);
            
            // Handle specific database errors
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'An account with this email already exists.',
                    error: 'EMAIL_ALREADY_EXISTS'
                });
            }
            
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data provided.',
                    error: 'INVALID_DATA'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Check for required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required.',
                    error: 'MISSING_CREDENTIALS'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address.',
                    error: 'INVALID_EMAIL_FORMAT'
                });
            }

            // Validation is handled by middleware
            const result = await UserModel.validateUser(email, password);

            if (!result.success) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password. Please check your credentials.',
                    error: 'INVALID_CREDENTIALS'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: result.user.userId, 
                    email: result.user.email 
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Set token in cookie (optional)
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: result.user.userId,
                    name: result.user.name,
                    email: result.user.email
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific database errors
            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                return res.status(503).json({
                    success: false,
                    message: 'Database connection error. Please try again later.',
                    error: 'DATABASE_CONNECTION_ERROR'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    static async logout(req, res) {
        try {
            res.clearCookie('token');
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    static async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            const user = await UserModel.findUserByEmail(req.user.email);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User profile not found.',
                    error: 'USER_NOT_FOUND'
                });
            }

            const { password: _, ...userWithoutPassword } = user;
            res.json({
                success: true,
                user: userWithoutPassword
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    static async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const { name } = req.body;

            // Validate name if provided
            if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Name must be a non-empty string.',
                    error: 'INVALID_NAME'
                });
            }

            const result = await UserModel.updateUser(userId, { name });

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to update profile. Please try again.',
                    error: 'PROFILE_UPDATE_FAILED'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: result.user
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    }
}

module.exports = UserController;
