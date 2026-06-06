const express = require('express');
const router = express.Router();
const {
    createApproval,
    approveQuotation,
    rejectQuotation,
    getApprovalById
} = require('../controller/approvals.controller');

router.post("/", createApproval);
router.patch("/:id/approve", approveQuotation);
router.patch("/:id/reject", rejectQuotation);
router.get("/:id", getApprovalById);

module.exports = router;
