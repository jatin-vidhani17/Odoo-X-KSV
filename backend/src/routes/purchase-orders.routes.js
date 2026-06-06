const express = require('express');
const router = express.Router();
const {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePOStatus,
    getPOPDF
} = require('../controller/purchase-orders.controller');

router.post("/", createPurchaseOrder);
router.get("/", getAllPurchaseOrders);
router.get("/:id", getPurchaseOrderById);
router.patch("/:id/status", updatePOStatus);
router.get("/:id/pdf", getPOPDF);

module.exports = router;
