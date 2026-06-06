const express = require('express');
const router = express.Router();
const {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    payInvoice,
    getInvoicePDF,
    emailInvoice
} = require('../controller/invoices.controller');

router.post("/", createInvoice);
router.get("/", getAllInvoices);
router.get("/:id", getInvoiceById);
router.patch("/:id/pay", payInvoice);
router.get("/:id/pdf", getInvoicePDF);
router.post("/:id/email", emailInvoice);

module.exports = router;
