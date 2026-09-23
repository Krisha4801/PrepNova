import re

def clean_text(text: str) -> str:
    """
    Basic cleanup while preserving useful document structure.
    """

    text = text.replace("\x00", "")

    # Normalize excessive spaces
    text = re.sub(r"[ \t]+", " ", text)

    # Normalize excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def has_meaningful_text(text: str, minimum_chars: int = 100) -> bool:
    """
    Simple heuristic to decide whether native PDF extraction
    produced usable text.
    """

    if not text:
        return False

    alphanumeric_count = sum(char.isalnum() for char in text)

    return alphanumeric_count >= minimum_chars