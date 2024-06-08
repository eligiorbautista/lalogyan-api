import express from "express";
import Admin from "../models/admin.mjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import sendMail from "../utils/mailer.mjs";
import AdminAuditTrail from "../models/adminAuditTrail.mjs";
import { adminAuthRoutesDocumentation } from "../utils/constants.mjs";
import { check, validationResult } from "express-validator";

const router = express.Router();
const secret_key = process.env.JWT_SECRET || "iloveopenit<3";

/* DOCUMENTATION */
router.get("/api/admin-auth/doc", (req, res) => {
  res.send(adminAuthRoutesDocumentation);
});

/* REGISTER */
router.post(
  "/api/admin-auth/register",
  [
    check("username", "Username is required").notEmpty(),
    check("password", "Password must be at least 6 characters long").isLength({
      min: 6,
    }),
    check("email", "Email is not valid").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email } = req.body;
    try {
      const admin = new Admin({ username, password, email });

      await admin.save();
      res.status(201).json({ message: "Admin registered successfully" });

      /* LOG REGISTRATION */
      await AdminAuditTrail.create({
        adminId: admin._id,
        action: "REGISTER",
        details: `Admin registered with username: ${username} and email: ${email}`,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* LOGIN */
router.post(
  "/api/admin-auth/login",
  [
    check("usernameOrEmail", "Username or email is required").notEmpty(),
    check("password", "Password is required").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { usernameOrEmail, password } = req.body;
    try {
      const admin = await Admin.findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      });

      if (!admin) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isMatch = await admin.validatePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          permissions: admin.permissions,
        },
        secret_key,
        {
          expiresIn: "1h",
        }
      );

      res.cookie("token", token, { httpOnly: true });
      res.status(200).json({ message: "Logged in successfully" });

      /* LOG ADMIN LOGIN */
      await AdminAuditTrail.create({
        adminId: admin._id,
        action: "Login",
        details: `Admin login with username/email: ${usernameOrEmail}`,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
);

/* LOGOUT  */
router.post("/api/admin-auth/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

/* RESET PASSWORD */
router.post(
  "/api/admin-auth/reset-password",
  [check("email", "Email is not valid").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    try {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(400).json({ message: "Admin not found" });
      }

      const otp = crypto.randomInt(100000, 999999).toString();

      const salt = await bcrypt.genSalt(10);
      admin.otp = await bcrypt.hash(otp, salt);
      admin.otpExpiry = Date.now() + 60000 * 2;

      /* LOG REQUEST PASSWORD RESET */
      await AdminAuditTrail.create({
        adminId: admin._id,
        action: "Request Password Reset",
        details: `User with email: ${email} request a password reset.`,
      });

      await admin.save();

      const message = `Your OTP for password reset is ${otp}`;
      await sendMail(admin.email, "Password Reset OTP", message);

      res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* VERIFY OTP */
router.post(
  "/api/admin-auth/verify-otp",
  [
    check("email", "Email is not valid").isEmail(),
    check("otp", "OTP is required").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;
    try {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(400).json({ message: "Admin not found" });
      }
      if (Date.now() > admin.otpExpiry) {
        return res.status(400).json({ message: "OTP expired" });
      }
      const isMatch = await admin.validateOTP(otp);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      /* LOG OTP VERIFICATION */
      await AdminAuditTrail.create({
        adminId: admin._id,
        action: "OTP Verification",
        details: ` Admin with email: ${email} verified a otp verification.`,
      });

      res
        .status(200)
        .json({ message: "OTP verified, proceed to reset password" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/* RESET PASSWORD */
router.post(
  "/api/admin-auth/reset-password-final",
  [
    check("email", "Email is not valid").isEmail(),
    check("otp", "OTP is required").notEmpty(),
    check(
      "newPassword",
      "Password must be at least 6 characters long"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;
    try {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(400).json({ message: "Admin not found" });
      }
      if (Date.now() > admin.otpExpiry) {
        return res.status(400).json({ message: "OTP expired" });
      }
      const isMatch = await admin.validateOTP(otp);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      /* LOG PASSWORD RESET */
      await AdminAuditTrail.create({
        adminId: admin._id,
        action: "Password Reset",
        details: `Admin with email: ${email} successfully reset password.`,
      });

      admin.password = newPassword;
      admin.otp = undefined;
      admin.otpExpiry = undefined;
      await admin.save();

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
