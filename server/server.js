import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import ReceiptProcessor from "./services/receiptProcessor.js";
import Receipt from "./models/Receipt.js";

dotenv.config();
const receiptProcessor = new ReceiptProcessor(process.env.HUGGINGFACE_API_KEY);
const app = express();
const PORT = process.env.BACK_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Server connected to MongoDB"))
  .catch((err) => console.error("Server MongoDB connection error:", err));

// Process receipt image
app.post("/api/process-receipt", async (req, res) => {
  try {
    const { imageUrl, userId, category } = req.body;

    // Process the receipt image
    const extractedData = await receiptProcessor.processImage(imageUrl);

    // Create and save receipt
    const receipt = new Receipt({
      userId,
      category,
      ...extractedData,
      imageUrl,
    });

    await receipt.save();
    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error("Receipt processing error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get receipts for a user
app.get("/api/receipts/:userId", async (req, res) => {
  try {
    const receipts = await Receipt.find({ userId: req.params.userId });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics for a user
app.get("/api/stats/:userId", async (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    const receipts = await Receipt.find({
      userId: req.params.userId,
      date: { $gte: startDate },
    });

    const stats = receipts.reduce((acc, receipt) => {
      if (!acc[receipt.category]) {
        acc[receipt.category] = {
          total: 0,
          count: 0,
        };
      }
      acc[receipt.category].total += receipt.amount;
      acc[receipt.category].count += 1;
      return acc;
    }, {});

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a receipt
app.delete("/api/receipts/:id", async (req, res) => {
  try {
    await Receipt.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Receipt deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
