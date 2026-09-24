import os
import tempfile
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.document.pdf_parser import extract_pdf_text
from app.services.document.ocr import ocr_pdf
from app.services.document.cleaner import clean_text, has_meaningful_text
from app.services.extraction.jd_extractor import JDExtractor

router = APIRouter(prefix="/jd", tags=["JD"])


@router.post("/extract")
async def extract_jd(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):

    # Case 1: Directly pasted JD text
    if text and text.strip():

        jd_text = clean_text(text)

    # Case 2: JD uploaded as PDF
    elif file:

        if file.content_type != "application/pdf":
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported."
            )

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf"
        ) as temp_file:

            temp_file.write(await file.read())
            temp_path = temp_file.name

        try:
            # First try normal PDF text extraction
            jd_text = extract_pdf_text(temp_path)

            # If PDF has little/no text, use OCR
            if not has_meaningful_text(jd_text):
                jd_text = ocr_pdf(temp_path)

            jd_text = clean_text(jd_text)

        finally:
            os.remove(temp_path)

    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either JD text or a PDF file."
        )

    # Make sure we actually obtained useful text
    if not has_meaningful_text(jd_text):
        raise HTTPException(
            status_code=400,
            detail="Could not extract meaningful JD content."
        )

    # JD-specific categorization
    extractor = JDExtractor()

    result = extractor.extract(jd_text)

    return result