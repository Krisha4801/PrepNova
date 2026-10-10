from typing import Optional
import os
import uuid

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.services.document.pdf_parser import extract_pdf_text
from app.services.document.ocr import ocr_pdf
from app.services.document.cleaner import (
    clean_text,
    has_meaningful_text,
)
from app.services.extraction.resume_extractor import ResumeExtractor
from app.services.processing.chunker import resume_to_documents
from app.services.vectorstore.chroma_store import ChromaStore


router = APIRouter(
    prefix="/resume",
    tags=["Resume"],
)


UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/extract")
async def extract_resume(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    document_id: Optional[str] = Form(None),
    index_document: bool = Form(False)
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
        # 6. Index into ChromaDB if requested
        # -------------------------
        indexed = False
        chunks_count = 0
        doc_id = document_id or str(uuid.uuid4())

        if index_document and user_id:
            documents = resume_to_documents(resume)
            if documents:
                store = ChromaStore()
                store.add_documents(
                    documents=documents,
                    user_id=user_id,
                    document_id=doc_id,
                )
                indexed = True
                chunks_count = len(documents)

        # -------------------------
        # 7. Return result
        # -------------------------

        return {
            "success": True,
            "extraction_method": extraction_method,
            "resume": resume.model_dump(),
            "indexed": indexed,
            "chunks_count": chunks_count,
            "document_id": doc_id if indexed else document_id,
            "user_id": user_id
        }

    finally:

        # Delete temporary upload
        if os.path.exists(file_path):
            os.remove(file_path)