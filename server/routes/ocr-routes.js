import express from "express";
import { processReceipt } from "../controllers/ocr-controllers.js";

const router = express.Router();

export default router.post("/process-receipt", processReceipt);
