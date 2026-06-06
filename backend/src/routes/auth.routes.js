const express = require("express");
const router = express.Router();
const { 
    login, 
    register, 
    forgotPassword, 
    resetPassword, 
    logout, 
    me 
} = require("../controller/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);

module.exports = router;