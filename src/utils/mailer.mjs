import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL || "lalogyan.ph@gmail",
    pass: process.env.EMAIL_PASSWORD || "vvineziyzsuujsxh ",
  },
});

const sendMail = (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject,
    text,
  };
  return transporter.sendMail(mailOptions);
};

export default sendMail;
