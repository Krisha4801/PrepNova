import os
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.document.pdf_parser import extract_pdf_text
from app.services.document.ocr import ocr_pdf
from app.services.document.cleaner import (
    clean_text,
    has_meaningful_text,
)
from app.services.extraction.resume_extractor import ResumeExtractor


router = APIRouter(
    prefix="/resume",
    tags=["Resume"],
)


UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/extract")
async def extract_resume(
    file: UploadFile = File(...)
):

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    file_id = str(uuid.uuid4())

    file_path = os.path.join(
        UPLOAD_DIR,
        f"{file_id}.pdf"
    )

    try:

        # -------------------------
        # 1. Save uploaded file
        # -------------------------

        contents = await file.read()

        with open(file_path, "wb") as f:
            f.write(contents)

        # -------------------------
        # 2. Try normal PDF extraction
        # -------------------------

        text = extract_pdf_text(file_path)

        extraction_method = "pdf_text"

        # -------------------------
        # 3. OCR fallback
        # -------------------------

        if not has_meaningful_text(text):

            text = ocr_pdf(file_path)

            extraction_method = "ocr"

        # -------------------------
        # 4. Clean text
        # -------------------------

        text = clean_text(text)

        if not text:
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from resume.",
            )

        # -------------------------
        # 5. LLM extraction
        # -------------------------

        extractor = ResumeExtractor()

        resume = extractor.extract(text)

        # -------------------------
        # 6. Return result
        # -------------------------

        return {
            "success": True,
            "extraction_method": extraction_method,
            "resume": resume.model_dump(),
        }

    finally:

        # Delete temporary upload
        if os.path.exists(file_path):
            os.remove(file_path)