const express = require('express');
const router = express.Router();
const {
    createApproval,
    approveQuotation,
    rejectQuotation,
    getApprovalById,
    listApprovals
} = require('../controller/approvals.controller');

router.post("/", createApproval);
router.get("/", listApprovals);
router.patch("/:id/approve", approveQuotation);
router.patch("/:id/reject", rejectQuotation);
router.get("/:id", getApprovalById);

module.exports = router;
