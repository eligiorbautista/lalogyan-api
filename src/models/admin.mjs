import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  permissions: {
    read: { type: Boolean, default: true },
    write: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true },
  },
  otp: { type: String },
  otpExpiry: { type: Date },
});

adminSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.validatePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.validateOTP = async function (enteredOTP) {
  return await bcrypt.compare(enteredOTP, this.otp);
};

const User = mongoose.model("Admin", adminSchema);

export default User;
