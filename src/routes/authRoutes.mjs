import express from "express";
import User from "../models/users.mjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import sendMail from "../utils/mailer.mjs";
import { authRoutesDocumenation } from "../utils/constants.mjs";

const router = express.Router();
const secret_key = process.env.JWT_SECRET || "iloveopenit<3";

/* DOCUMENTATION */
router.get("/api/auth/doc", (req, res) => {
  res.send(authRoutesDocumenation);
});

/* REGISTER */
router.post("/api/auth/register", async (req, res) => {
  const { username, password, email } = req.body;
  console.log(username, password, email);
  try {
    const admin = new User({ username, password, email });
    await admin.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* LOGIN */
router.post("/api/auth/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      secret_key,
      {
        expiresIn: "1h",
      }
    );
    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* LOGOUT  */
router.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

/* RESET PASSWORD */
router.post("/api/auth/reset-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    const salt = await bcrypt.genSalt(10);
    user.otp = await bcrypt.hash(otp, salt);
    user.otpExpiry = Date.now() + 60000 * 2;

    await user.save();

    const message = `Your OTP for password reset is ${otp}`;
    await sendMail(user.email, "Password Reset OTP", message);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* VERIFY OTP */
router.post("/api/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }
    const isMatch = await user.validateOTP(otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res
      .status(200)
      .json({ message: "OTP verified, proceed to reset password" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* RESET PASSWORD */
router.post("/api/auth/reset-password-final", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }
    const isMatch = await user.validateOTP(otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
