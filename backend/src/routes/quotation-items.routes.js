const express = require('express');
const router = express.Router();
const {
    updateQuotationItem,
    deleteQuotationItem
} = require('../controller/quotations.controller');

router.put("/:id", updateQuotationItem);
router.delete("/:id", deleteQuotationItem);

module.exports = router;
