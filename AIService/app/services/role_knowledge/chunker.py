import re

from app.schemas.document import InterviewDocument
from app.services.processing.normalizer import normalize_text


class RoleKnowledgeChunker:
    """
    Splits role knowledge documents into smaller
    retrieval-friendly chunks.
    """

    def __init__(self, max_chars: int = 1200):
        self.max_chars = max_chars

    def _split_sections(self, text: str) -> list[str]:
        """
        Split Markdown based on headings.

        Example:

        # RAG
        ...

        # Embeddings
        ...

        becomes separate sections.
        """

        parts = re.split(
            r"\n(?=#{1,6}\s)",
            text,
        )

        return [
            normalize_text(part)
            for part in parts
            if normalize_text(part)
        ]

    def _split_large(self, text: str) -> list[str]:
        """
        If a section is too large, split it further.
        """

        if len(text) <= self.max_chars:
            return [text]

        paragraphs = [
            paragraph.strip()
            for paragraph in text.split("\n\n")
            if paragraph.strip()
        ]

        chunks: list[str] = []

        current = ""

        for paragraph in paragraphs:

            if not current:
                candidate = paragraph
            else:
                candidate = f"{current}\n\n{paragraph}"

            if len(candidate) <= self.max_chars:

                current = candidate

            else:

                if current:
                    chunks.append(current)

                if len(paragraph) <= self.max_chars:

                    current = paragraph

                else:

                    # Extremely large paragraph
                    for start in range(
                        0,
                        len(paragraph),
                        self.max_chars,
                    ):
                        chunks.append(
                            paragraph[
                                start:start + self.max_chars
                            ]
                        )

                    current = ""

        if current:
            chunks.append(current)

        return chunks

    def chunk(
        self,
        documents: list[InterviewDocument],
    ) -> list[InterviewDocument]:

        result: list[InterviewDocument] = []

        for document in documents:

            sections = self._split_sections(
                document.content
            )

            for section_index, section_text in enumerate(
                sections
            ):

                chunks = self._split_large(
                    section_text
                )

                for chunk_index, chunk_text in enumerate(
                    chunks
                ):

                    metadata = dict(
                        document.metadata
                    )

                    metadata.update(
                        {
                            "chunk_index": chunk_index,
                            "section_index": section_index,
                        }
                    )

                    result.append(
                        InterviewDocument(
                            content=chunk_text,
                            source=document.source,
                            document_type=document.document_type,
                            section=document.section,
                            metadata=metadata,
                        )
                    )

        return result