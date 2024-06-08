import express from "express";
import User from "../models/users.mjs";
import AdminAuditTrail from "../models/adminAuditTrail.mjs";

const router = express.Router();

/* View Users */
router.get("/api/users", async (req, res) => {
  try {
    const user = await User.find({});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await AdminAuditTrail.create({
      userId: user._id,
      action: "View",
      details: `All users are retrived from the database.`,
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* View User */
router.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await AdminAuditTrail.create({
      userId: user._id,
      action: "View",
      details: `Admin view a user with username: ${user.username} and email: ${user.email}`,
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* Delete User */
router.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* Update User */
router.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* Update User Permissions */
router.put("/api/users/:id/permissions", async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.permissions = permissions;
    await user.save();
    res.status(200).json({ message: "User permissions updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
