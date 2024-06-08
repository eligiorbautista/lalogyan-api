import mongoose from "mongoose";

const adminAuditTrail = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const AdminAuditTrail = mongoose.model("AdminAuditTrail", adminAuditTrail);
export default AdminAuditTrail;
