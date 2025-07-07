const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');

class UserController {
    static async signup(req, res) {
        try {
            const { name, email, password, dob } = req.body;

            // Validation is handled by middleware
            const result = await UserModel.createUser({
                name,
                email,
                password,
                dob
            });

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
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
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validation is handled by middleware
            const result = await UserModel.validateUser(email, password);

            if (!result.success) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
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
            res.status(500).json({
                success: false,
                message: 'Internal server error'
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
                message: 'Internal server error'
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
                    message: 'User not found'
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
                message: 'Internal server error'
            });
        }
    }

    static async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const { name } = req.body;

            const result = await UserModel.updateUser(userId, { name });

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to update profile'
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
                message: 'Internal server error'
            });
        }
    }
}

module.exports = UserController;
