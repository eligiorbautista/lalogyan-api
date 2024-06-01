import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./src/routes/authRoutes.mjs";
import adminRoutes from "./src/routes/adminRoutes.mjs";
dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const mongodb_uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lalogyan";

mongoose
  .connect(mongodb_uri)
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((err) => {
    console.error("An error occurred while connecting to MongoDB:", err);
  });

app.use(authRoutes);
app.use(adminRoutes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
