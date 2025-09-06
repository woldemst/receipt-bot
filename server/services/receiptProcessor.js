import FormData from "form-data";
import axios from "axios";
import "dotenv/config";

class ReceiptProcessor {
  constructor() {
    this.API_URL = process.env.API_URL;
  }

  async processImage(imageUrl) {
    try {
      // Lade Bild herunter
      const imageResp = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(imageResp.data);

      // Packe Bild in FormData
      const formData = new FormData();
      formData.append("file", buffer, "receipt.jpg");

      // Sende an OCR-Server
      const response = await axios.post(`${API_URL}/ocr`, formData, {
        headers: formData.getHeaders(),
      });

      const ocrResult = response.data;
      console.log("Tesseract OCR result:", ocrResult);

      // Beispiel: aus OCR-Text Betrag und Datum extrahieren

      const text = ocrResult.text;

      // Betrag finden
      const amountMatch = text.match(/(\d+,\d{2})\s*EUR/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(",", ".")) : null;

      // Preis pro Liter (z.B. "1,799 EUR/L" oder "EUR/L 1,799")
      const priceMatch = text.match(/(\d+[.,]\d{2})\s*(EUR\/L|EUR\/\s*L|€\/L)/i);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;

      // Datum (nur Tag.Monat.Jahr)
      const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
      let date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString("de-DE");
      // Convert "31.8.2025" to JS Date
      if (date && typeof date === "string" && date.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
        const [day, month, year] = date.split(".");
        date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
      }

      // Extract quantity (liters)
      // Try to match "34,27 L" or "34.27L" or "L 34,27"
      const quantityMatch =
        text.match(/(\d+[.,]\d{2})\s*L\b/i) || text.match(/L\s*(\d+[.,]\d{2})/i) || text.match(/(\d+[.,]\d{2})\s*Liter/i);
      const quantity = quantityMatch ? parseFloat(quantityMatch[1].replace(",", ".")) : null;

      // Extract fuel type
      const fuelTypes = ["Super", "E10", "Diesel", "Premium", "V-Power"];
      let fuel = null;
      for (const type of fuelTypes) {
        if (text.toLowerCase().includes(type.toLowerCase())) {
          fuel = type;
          break;
        }
      }

      // Extract station name/address (simple approach)
      let station = null;
      const stationMatch = text.match(/(Shell|Aral|Esso|Jet|Total|OMV|Star|Avia)[^\n]*/i);
      if (stationMatch) {
        station = stationMatch[0].trim();
      }

      // Return structured object

      // Build a receipt object from OCR

      return {
        amount: amount,
        quantity: quantity,
        fuel: fuel,
        price: price,
        date: date,
        station: station,
        // rawText: ocrResult.text,
        isValid: !!ocrResult.text,
      };
    } catch (error) {
      console.error("Receipt processing error:", error);
      throw new Error("Failed to process receipt image");
    }
  }
}

export default ReceiptProcessor;
