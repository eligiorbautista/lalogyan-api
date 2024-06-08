import express from "express";
import { body, validationResult } from "express-validator";
import User from "../models/users.mjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import sendMail from "../utils/mailer.mjs";
import UserAuditTrail from "../models/userAuditTrail.mjs";
import { userAuthRoutesDocumenation } from "../utils/constants.mjs";

const router = express.Router();
const secret_key = process.env.JWT_SECRET || "iloveopenit<3";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/* DOCUMENTATION */
router.get("/api/user-auth/doc", (req, res) => {
  res.send(userAuthRoutesDocumenation);
});

/* REGISTER */
router.post(
  "/api/user-auth/register",
  [
    body("username").isString().withMessage("Username must be a string"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("email").isEmail().withMessage("Invalid email format"),
  ],
  validate,
  async (req, res) => {
    const { username, password, email } = req.body;
    try {
      const user = new User({ username, password, email });

      await user.save();
      res.status(201).json({ message: "User registered successfully" });

      /* LOG REGISTRATION */
      await UserAuditTrail.create({
        userId: user._id,
        action: "Register",
        details: ` User registered with username: ${username} and email: ${email}`,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* LOGIN */
router.post(
  "/api/user-auth/login",
  [
    body("usernameOrEmail")
      .isString()
      .withMessage("Username or Email must be a string"),
    body("password").isString().withMessage("Password must be a string"),
  ],
  validate,
  async (req, res) => {
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

      /* LOG USER LOGIN */
      await UserAuditTrail.create({
        userId: user._id,
        action: "Login",
        details: `User logged in with username/email: ${usernameOrEmail}`,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* LOGOUT */
router.post("/api/user-auth/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

/* RESET PASSWORD */
router.post(
  "/api/user-auth/reset-password",
  [body("email").isEmail().withMessage("Invalid email format")],
  validate,
  async (req, res) => {
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

      /* LOG REQUEST PASSWORD RESET */
      await UserAuditTrail.create({
        userId: user._id,
        action: "Request Password Reset",
        details: `User with email: ${email} request a password reset.`,
      });

      await user.save();

      const message = `Your OTP for password reset is ${otp}`;
      await sendMail(user.email, "Password Reset OTP", message);

      res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* VERIFY OTP */
router.post(
  "/api/user-auth/verify-otp",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("otp").isNumeric().withMessage("OTP must be a number"),
  ],
  validate,
  async (req, res) => {
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

      /* LOG OTP VERIFICATION */
      await UserAuditTrail.create({
        userId: user._id,
        action: "OTP Verification",
        details: `User with email: ${email} verified an OTP.`,
      });

      res
        .status(200)
        .json({ message: "OTP verified, proceed to reset password" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* RESET PASSWORD FINAL */
router.post(
  "/api/user-auth/reset-password-final",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("otp").isNumeric().withMessage("OTP must be a number"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  validate,
  async (req, res) => {
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

      /* LOG PASSWORD RESET */
      await UserAuditTrail.create({
        userId: user._id,
        action: "Password Reset",
        details: `User with email: ${email} successfully reset password.`,
      });

      user.password = newPassword;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
