const express = require('express');
const router = express.Router();
const {
    createRFQ,
    getAllRFQs,
    getRFQsByVendor,
    getRFQById,
    updateRFQ,
    deleteRFQ,
    publishRFQ,
    addRFQItems,
    getRFQItems,
    assignRFQVendors,
    getRFQVendors,
    getRFQComparison
} = require('../controller/rfqs.controller');

// RFQ Base Routes
router.post("/", createRFQ);
router.get("/", getAllRFQs);
router.get("/vendor/:vendorId", getRFQsByVendor);
router.get("/:id", getRFQById);
router.put("/:id", updateRFQ);
router.delete("/:id", deleteRFQ);
router.patch("/:id/publish", publishRFQ);

// RFQ Nested Items Routes
router.post("/:rfqId/items", addRFQItems);
router.get("/:rfqId/items", getRFQItems);

// RFQ Assigned Vendors
router.post("/:rfqId/vendors", assignRFQVendors);
router.get("/:rfqId/vendors", getRFQVendors);

// RFQ Comparison
router.get("/:rfqId/comparison", getRFQComparison);

// RFQ Quotations
const { getQuotationsByRFQ } = require('../controller/quotations.controller');
router.get("/:rfqId/quotations", getQuotationsByRFQ);

module.exports = router;
