import re
from typing import Any

def normalize_text(text: str)-> str:
    """
    Clean text without removing meaningful information.
    """

    if not text:
        return ""

    # Normalize line endings
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Remove excessive spaces/tab
    text = re.sub(r"[ \t]+", " ",text)

    # Remove excessive blank lines
    text = re.sub(r"\n{3,}","\n\n",text)

    return text.strip()


def normalize_list(items: list[str] | None)-> list[str]:
    """
    Clean a list of strings.
    """
    if not items:
        return []

    result = []

    for item in items:
        if not item:
            continue
        
        value = normalize_text(item)

        if value: 
            result.append(value)

    return result

def normalize_value(
    value: Any,
)-> str:
    """
    Convert a value to normalized text.
    """

    if value is None:
        return ""

    if isinstance(value, str):
        return normalize_text(value)

    return normalize_text(str(value))


    