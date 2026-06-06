const express = require('express');

const router = express.Router();


const {
    getUserById,
} = require('../controller/users.controller');

router.get("/:id",getUserById);


module.exports = router;