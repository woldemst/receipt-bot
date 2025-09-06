import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import receiptRoutes from "./routes/ocr-routes.js";

dotenv.config();

const app = express();
const PORT = process.env.BACK_PORT;

app.use("/api", receiptRoutes);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Server connected to MongoDB"))
  .catch((err) => console.error("Server MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
