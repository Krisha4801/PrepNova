import pymupdf

def extract_pdf_text(file_path: str)-> str:
    """
    Extract text from a normal text-based PDF.
    """
    text_parts = []

    with pymupdf.open(file_path) as document:
        for page in document:
            text = page.get_text("text")
            text_parts.append(text)

    return "\n".join(text_parts).strip()


