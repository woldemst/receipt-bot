from fastapi import FastAPI, UploadFile, File
from PIL import Image, ImageOps, ImageFilter
import pytesseract
import io

app = FastAPI()

# Preprocessing function
def preprocess_image(image):
    # Convert to grayscale
    image = ImageOps.grayscale(image)
    # Increase contrast
    image = ImageOps.autocontrast(image)
    # Apply binarization (thresholding)
    image = image.point(lambda x: 0 if x < 160 else 255, '1')
    # Optionally, sharpen
    image = image.filter(ImageFilter.SHARPEN)
    return image

@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    content = await file.read()
    image = Image.open(io.BytesIO(content))
    image = preprocess_image(image)
    text = pytesseract.image_to_string(image, lang="deu+eng")
    return {"text": text}