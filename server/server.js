import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { processReceipt } from "./controllers/ocr-controllers.js";

dotenv.config();

const app = express();
const PORT = process.env.BACK_PORT;

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // not like "GET", "POST", "PATCH", "DELETE" it does not work
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  next();
});
app.use(express.json());

app.post("/api/process-receipt", processReceipt);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Server connected to MongoDB"))
  .catch((err) => console.error("Server MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
