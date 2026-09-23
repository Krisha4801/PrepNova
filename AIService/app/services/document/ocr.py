import pymupdf
import pytesseract
from PIL import Image

from app.core.config import settings

if settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


def ocr_pdf(file_path: str) -> str:
    """
    OCR every page of an image/scanned PDF.
    """

    text_parts = []

    with pymupdf.open(file_path) as document:
        for page in document:

            pixmap = page.get_pixmap(dpi=200)

            image = Image.frombytes(
                "RGB",
                [pixmap.width, pixmap.height],
                pixmap.samples,
            )

            text = pytesseract.image_to_string(image)

            text_parts.append(text)

    return "\n".join(text_parts).strip()