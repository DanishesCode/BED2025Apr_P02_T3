const jwt = require('jsonwebtoken');

class AuthMiddleware {
    static authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        // Also check for token in cookies
        const cookieToken = req.cookies?.token;
        const finalToken = token || cookieToken;

        if (!finalToken) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        jwt.verify(finalToken, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }

            req.user = user;
            next();
        });
    }

    static optionalAuth(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const cookieToken = req.cookies?.token;
        const finalToken = token || cookieToken;

        if (!finalToken) {
            req.user = null;
            return next();
        }

        jwt.verify(finalToken, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
            if (err) {
                req.user = null;
            } else {
                req.user = user;
            }
            next();
        });
    }

    static requireAuth(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        next();
    }

    static rateLimitLogin(req, res, next) {
        // Simple rate limiting for login attempts
        const clientIp = req.ip || req.connection.remoteAddress;
        const key = `login_attempts_${clientIp}`;
        
        // In production, use Redis or similar for distributed rate limiting
        if (!req.app.locals.rateLimitStore) {
            req.app.locals.rateLimitStore = new Map();
        }
        
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutes
        const maxAttempts = 5;
        
        const attempts = req.app.locals.rateLimitStore.get(key) || [];
        const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
        
        if (recentAttempts.length >= maxAttempts) {
            return res.status(429).json({
                success: false,
                message: 'Too many login attempts. Please try again later.'
            });
        }
        
        // Add current attempt
        recentAttempts.push(now);
        req.app.locals.rateLimitStore.set(key, recentAttempts);
        
        next();
    }
}

module.exports = AuthMiddleware;