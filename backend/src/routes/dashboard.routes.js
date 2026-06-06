const express = require('express');
const router = express.Router();
const {
    getDashboardSummary,
    getVendorAnalytics,
    getProcurementAnalytics,
    getSpendingAnalytics,
    getMonthlyTrends
} = require('../controller/dashboard.controller');

// Matches: GET /api/dashboard (when mounted at /api/dashboard)
router.get("/", getDashboardSummary);

// Matches: GET /api/analytics/vendors, etc. (when mounted at /api/analytics)
router.get("/vendors", getVendorAnalytics);
router.get("/procurement", getProcurementAnalytics);
router.get("/spending", getSpendingAnalytics);
router.get("/monthly-trends", getMonthlyTrends);

module.exports = router;
