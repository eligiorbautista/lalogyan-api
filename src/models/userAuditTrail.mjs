import mongoose from "mongoose";

const userAauditTrailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const UserAuditTrail = mongoose.model("UserAuditTrail", userAauditTrailSchema);
export default UserAuditTrail;
