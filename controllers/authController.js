const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail"); 
const logger = require("../utils/logger");


exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      logger.warn(`Registration attempt failed: ${email} already exists`);
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ username, email, password });
    await newUser.save(); 

    logger.info(`New user registered: ${email}`);
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: "Server Error", error });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`Failed login attempt for non-existent email: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Failed login attempt: Incorrect password for ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true, secure: false });

    logger.info(`User ${email} logged in successfully`);
    res.json({ message: "Login successful", token });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: "Server Error", error });
  }
};


exports.logout = (req, res) => {
  res.clearCookie("token");
  logger.info(`User logged out`);
  res.json({ message: "Logged out successfully" });
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return res.status(404).json({ message: "User not found" });
    }

  
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; 
    await user.save();

    
    await sendEmail(email, "Password Reset Request", `You requested a password reset. Use this token: ${resetToken}`);

    logger.info(`Password reset email sent to ${email}`);
    res.json({ message: "Reset link sent to email" });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({ message: "Server Error", error });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

    if (!user) {
      logger.warn(`Invalid or expired password reset token used`);
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = newPassword; 
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save(); 

    logger.info(`User ${user.email} successfully reset their password`);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    res.status(500).json({ message: "Server Error", error });
  }
};
