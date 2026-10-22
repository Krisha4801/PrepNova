import os
from pathlib import Path
from typing import Union
import pymupdf

def extract_pdf_text(file_input: Union[str, Path, bytes]) -> str:
    """
    Extract text from a normal text-based PDF with strict error handling for
    empty, corrupted, and encrypted files (PDF §4.1).
    Supports either a file path (str/Path) or raw PDF bytes.
    """
    if isinstance(file_input, (bytes, bytearray)):
        if len(file_input) == 0:
            raise ValueError("Uploaded file is empty (0 bytes).")
        try:
            document = pymupdf.open(stream=file_input, filetype="pdf")
        except Exception as e:
            raise ValueError(f"The PDF file is corrupted or unreadable: {str(e)}")
    else:
        file_path = str(file_input)
        if not os.path.exists(file_path):
            raise ValueError("File does not exist on disk.")
        if os.path.getsize(file_path) == 0:
            raise ValueError("Uploaded file is empty (0 bytes).")
        try:
            document = pymupdf.open(file_path)
        except Exception as e:
            raise ValueError(f"The PDF file is corrupted or unreadable: {str(e)}")

    try:
        with document:
            if document.is_encrypted:
                raise ValueError("The PDF file is password-protected or encrypted. Please remove password protection and retry.")
            
            if len(document) == 0:
                raise ValueError("Uploaded PDF has 0 pages.")

            text_parts = []
            for page in document:
                text = page.get_text("text")
                if text:
                    text_parts.append(text)

            return "\n".join(text_parts).strip()
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"The PDF file is corrupted or unreadable: {str(e)}")
