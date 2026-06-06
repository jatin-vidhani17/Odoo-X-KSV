const express = require('express');
const router = express.Router();
const {
    updateRFQItem,
    deleteRFQItem
} = require('../controller/rfqs.controller');

router.put("/:id", updateRFQItem);
router.delete("/:id", deleteRFQItem);

module.exports = router;
