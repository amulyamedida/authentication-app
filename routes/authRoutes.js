const express = require("express");
const { register, login, logout, forgotPassword, resetPassword } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { check } = require("express-validator");

const router = express.Router();

router.post("/register", [
  check("username").notEmpty().withMessage("Username is required"),
  check("email").isEmail().withMessage("Invalid email"),
  check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
], register);

router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
