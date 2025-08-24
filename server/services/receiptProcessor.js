import fetch from "node-fetch";
import FormData from "form-data";

class ReceiptProcessor {
  async processImage(imageUrl) {
    try {
      // Lade Bild herunter
      const imageResp = await fetch(imageUrl);
      const buffer = await imageResp.buffer();

      // Packe Bild in FormData
      const formData = new FormData();
      formData.append("file", buffer, "receipt.jpg");

      // Sende an OCR-Server
      const response = await fetch("http://localhost:8000/ocr", {
        method: "POST",
        body: formData,
      });

      const ocrResult = await response.json();
      console.log("Tesseract OCR result:", ocrResult);

      // Beispiel: aus OCR-Text Betrag und Datum extrahieren
      const text = ocrResult.text;

      // Betrag finden
      const amountMatch = text.match(/(\d+,\d{2})\s*EUR/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(",", ".")) : null;

      // Datum finden (dd.mm.yyyy oder dd.mm.yy)
      const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{2,4})/);
      const date = dateMatch ? new Date(dateMatch[1].replace(/(\d{2})\.(\d{2})\.(\d{2,4})/, "$3-$2-$1")) : new Date();

      // 👇 hier kannst du wie gehabt HuggingFace oder Regex zum Strukturieren nutzen
      return {
        amount: amount,
        quantity: null,
        fuel: null,
        price: null,
        date: new Date().toLocaleDateString("de-DE"),
        station: null,
        rawText: ocrResult.text,
      };
    } catch (error) {
      console.error("Receipt processing error:", error);
      throw new Error("Failed to process receipt image");
    }
  }
}

export default ReceiptProcessor;
