import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["Fuel", "Groceries", "Other"],
  },
  amount: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
  },
  fuel: {
    type: String,
  },
  price: {
    type: Number,
  },
  date: {
    type: Date,
    required: true,
  },
  station: {
    type: String,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Receipt = mongoose.model("Receipt", receiptSchema);

export default Receipt;
