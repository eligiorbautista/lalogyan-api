import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userAuthRoutes from "./src/routes/userAuthRoutes.mjs";
import adminAuthRoutes from "./src/routes/adminAuthRoutes.mjs";
import userRoutes from "./src/routes/userRoutes.mjs";
dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const mongodb_uri =
  process.env.MONGODB_URI ||
  `mongodb+srv://itelibautista:po9Ctf9L1Hn6YZCA@lalogyan-cluster.b9goeik.mongodb.net/lalogyan?retryWrites=true&w=majority&appName=lalogyan-cluster`;

mongoose
  .connect(mongodb_uri)
  .then(() => {
    console.log("Successfully connected to MongoDB ✓");
  })
  .catch((err) => {
    console.error("An error occurred while connecting to MongoDB ✗ : ", err);
  });

app.use(userAuthRoutes);
app.use(adminAuthRoutes);
app.use(userRoutes);

app.listen(port, () => {
  console.clear();
  console.log(`Server listening on port ${port} ✓`);
});
