const express = require('express');
const router = express.Router();
const {
    createQuotation,
    getAllQuotations,
    getQuotationById,
    addQuotationItems
} = require('../controller/quotations.controller');

router.post("/", createQuotation);
router.get("/", getAllQuotations);
router.get("/:id", getQuotationById);
router.post("/:quotationId/items", addQuotationItems);

module.exports = router;
