const express = require('express');
const router = express.Router();
const { ChatMessage } = require('../models/chatMessage');
const { User } = require('../models/user');
const mongoose = require('mongoose');

// Admin: Get all chat messages (grouped by user)
router.get('/admin/messages', async (req, res) => {
    try {
        // Get all chat messages
        const messages = await ChatMessage.find().sort({ timestamp: -1 });

        // Get all users who have messages
        const userIds = [...new Set(messages.map(m => m.userId))];
        const users = await User.find({ _id: { $in: userIds } });

        // Add user info to messages
        const enrichedMessages = messages.map(msg => {
            const user = users.find(u => u._id.toString() === msg.userId.toString());
            return {
                ...msg.toObject(),
                userName: user ? user.name : 'Unknown User',
                userEmail: user ? user.email : 'No Email'
            };
        });

        return res.status(200).json(enrichedMessages);
    } catch (error) {
        console.error('Error fetching admin messages:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error fetching chat messages: ' + error.message
        });
    }
});

// Admin: Reply to a message
router.post('/admin/reply', async (req, res) => {
    try {
        const { userId, message } = req.body;

        if (!userId || !message?.trim()) {
            return res.status(400).json({
                success: false,
                msg: 'User ID and message are required'
            });
        }

        // Create admin reply
        const reply = new ChatMessage({
            userId,
            message: message.trim(),
            sender: 'admin'
        });

        await reply.save();

        return res.status(201).json({
            success: true,
            reply
        });
    } catch (error) {
        console.error('Error sending admin reply:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error sending reply: ' + error.message
        });
    }
});

// Admin: Mark all messages as read for a user
router.put('/admin/mark-read/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await ChatMessage.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } }
        );

        return res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error marking messages as read: ' + error.message
        });
    }
});

// Get all chat messages for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("Fetching chat messages for userId:", userId);

        // Validate userId format
        if (!mongoose.isValidObjectId(userId)) {
            console.error("Invalid user ID format:", userId);
            return res.status(400).json({
                success: false,
                msg: 'Invalid user ID format'
            });
        }

        // Check if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            console.error("User not found with ID:", userId);
            return res.status(404).json({
                success: false,
                msg: 'User not found'
            });
        }

        // Get chat messages
        const chatMessages = await ChatMessage.find({ userId }).sort({ timestamp: 1 });
        console.log(`Found ${chatMessages.length} messages for userId: ${userId}`);
        
        return res.status(200).json(chatMessages);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error fetching chat messages: ' + error.message
        });
    }
});

// Send a new message
router.post('/message', async (req, res) => {
    try {
        const { userId, message } = req.body;
        console.log("Received message request:", { userId, messageLength: message?.length });
        
        if (!userId) {
            console.error("No userId provided in request");
            return res.status(400).json({
                success: false,
                msg: 'User ID is required'
            });
        }
        
        // Validate userId format
        if (!mongoose.isValidObjectId(userId)) {
            console.error("Invalid user ID format:", userId);
            return res.status(400).json({
                success: false,
                msg: 'Invalid user ID format'
            });
        }

        // Check if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            console.error("User not found with ID:", userId);
            return res.status(404).json({
                success: false,
                msg: 'User not found'
            });
        }

        // Validate message
        if (!message || !message.trim()) {
            console.error("Empty message provided");
            return res.status(400).json({
                success: false,
                msg: 'Message cannot be empty'
            });
        }

        // Create user message
        const newMessage = new ChatMessage({
            userId,
            message,
            sender: 'user'
        });
        
        await newMessage.save();
        console.log("User message saved with ID:", newMessage._id);

        // Generate simple automated response
        const autoResponse = new ChatMessage({
            userId,
            message: "Thank you for your message. Our team will get back to you shortly.",
            sender: 'admin'
        });
        
        await autoResponse.save();
        console.log("Admin response saved with ID:", autoResponse._id);

        return res.status(201).json({
            success: true,
            userMessage: newMessage,
            adminResponse: autoResponse
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error sending message: ' + error.message
        });
    }
});

// Mark messages as read
router.put('/mark-read/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("Marking messages as read for userId:", userId);

        // Validate userId format
        if (!mongoose.isValidObjectId(userId)) {
            console.error("Invalid user ID format:", userId);
            return res.status(400).json({
                success: false,
                msg: 'Invalid user ID format'
            });
        }

        // Update all unread messages to read
        const result = await ChatMessage.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } }
        );

        console.log(`Marked ${result.modifiedCount} messages as read for userId: ${userId}`);
        
        return res.status(200).json({
            success: true,
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error marking messages as read: ' + error.message
        });
    }
});

module.exports = router;
