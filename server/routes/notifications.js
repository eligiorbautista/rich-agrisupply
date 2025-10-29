const express = require('express');
const router = express.Router();
const { Notification } = require('../models/notification');
const { User } = require('../models/user');
const authJwt = require('../helper/jwt');
const jwt = require('jsonwebtoken');
const jwtMiddleware = authJwt();

// Middleware to verify admin role (robust): resolves user from token and checks role/isAdmin
const verifyAdminRole = async (req, res, next) => {
    try {
        let userId = null;

        // Prefer id from express-jwt decoded payload
        if (req.auth && (req.auth.id || req.auth._id || req.auth.userId || req.auth.sub)) {
            userId = req.auth.id || req.auth._id || req.auth.userId || req.auth.sub;
        } else {
            // Fallback: manually verify Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
            }
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY);
                userId = decoded.id || decoded._id || decoded.userId || decoded.sub;
            } catch (e) {
                return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
            }
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid token - no user id' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isAdmin = user.role === 'admin' || user.isAdmin === true;
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        // attach user for downstream use if needed
        req.user = user;
        return next();
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all notifications for admin
router.get('/', jwtMiddleware, verifyAdminRole, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(50);
        
        const unreadCount = await Notification.countDocuments({ isRead: false });
        
        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mark notification as read
router.put('/:id/read', jwtMiddleware, verifyAdminRole, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mark all notifications as read
router.put('/read-all', jwtMiddleware, verifyAdminRole, async (req, res) => {
    try {
        await Notification.updateMany(
            { isRead: false },
            { isRead: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
