from fastapi import FastAPI, UploadFile, File
from PIL import Image
import pytesseract
import io

app = FastAPI()

@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    content = await file.read()
    image = Image.open(io.BytesIO(content))
    text = pytesseract.image_to_string(image, lang="deu+eng")
    return {"text": text}