const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead
} = require('../controller/notifications.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get("/", authMiddleware, getNotifications);
router.patch("/read-all", authMiddleware, markAllAsRead);
router.patch("/:id/read", authMiddleware, markAsRead);

module.exports = router;
