const express = require('express');
const router = express.Router();
const {
    getAllLogs,
    getLogById
} = require('../controller/activity-logs.controller');

router.get("/", getAllLogs);
router.get("/:id", getLogById);

module.exports = router;
