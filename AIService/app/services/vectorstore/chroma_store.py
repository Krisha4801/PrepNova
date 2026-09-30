from rich.traceback import PathHighlighter
from pathlib import Path
from typing import List, Optional
import chromadb
from app.schemas.document import InterviewDocument
from app.services.embeddings.service import EmbeddingService

class ChromaStore:

    def __init__(self,
        persist_directory: str = "data/chroma",
        collection_name: str = "prep_nova",
    ):
        Path(
            persist_directory
        ).mkdir(
            parents=True,
            exist_ok=True,
        )

        self.client = chromadb.PersistentClient(
            path = persist_directory
        )

        self.collection = (
            self.client.get_or_create_collection(
                name = collection_name,
                metadata={
                    "description" : "PrepNova searchable documents"
                },
            )
        )

        self.embedding_service = (
            EmbeddingService()
        )

        # =========================================================
    # ADD DOCUMENTS
    # =========================================================

    def add_documents(
        self,
        documents: List[InterviewDocument],
        user_id: str,
        document_id: str,
    ):

        if not documents:
            return

        texts = [
            document.content
            for document in documents
        ]

        embeddings = (
            self.embedding_service
            .embed_documents(texts)
        )

        metadatas = []

        for document in documents:

            metadata = {
                # Ownership
                "scope": "user",
                "user_id": user_id,
                "document_id": document_id,

                # Document information
                "source": document.source,
                "document_type": (
                    document.document_type
                ),
                "section": document.section,

                # Additional metadata
                **document.metadata,
            }

            metadatas.append(metadata)

        # IDs are unique per document.
        ids = [
            f"{document_id}:{index}"
            for index in range(len(documents))
        ]

        self.collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    # =========================================================
    # SEARCH
    # =========================================================

    def search(
        self,
        query: str,
        user_id: str,
        document_id: Optional[str] = None,
        top_k: int = 5,
    ):

        query_embedding = (
            self.embedding_service
            .embed_query(query)
        )

        # -----------------------------------------------------
        # User + specific document
        # -----------------------------------------------------

        if document_id:

            where = {
                "$and": [
                    {
                        "scope": "user"
                    },
                    {
                        "user_id": user_id
                    },
                    {
                        "document_id": document_id
                    },
                ]
            }

        # -----------------------------------------------------
        # User's documents
        # -----------------------------------------------------

        else:

            where = {
                "$and": [
                    {
                        "scope": "user"
                    },
                    {
                        "user_id": user_id
                    },
                ]
            }

        return self.collection.query(
            query_embeddings=[
                query_embedding
            ],
            n_results=top_k,
            where=where,
        )

    # =========================================================
    # DELETE DOCUMENT
    # =========================================================

    def delete_document(
        self,
        user_id: str,
        document_id: str,
    ):

        self.collection.delete(
            where={
                "$and": [
                    {
                        "scope": "user"
                    },
                    {
                        "user_id": user_id
                    },
                    {
                        "document_id": document_id
                    },
                ]
            }
        )

    # =========================================================
    # COUNT
    # =========================================================

    def count(self) -> int:

        return self.collection.count()

    # =========================================================
    # ROLE DOCUMENTS
    # =========================================================

    def add_role_documents(
    self,
    documents: list[InterviewDocument],
    role: str,
    ):

        """
        Store global role knowledge documents
        in the same Chroma collection used by Phase 2.
        """

        if not documents:
            return

        texts = [
            document.content
            for document in documents
        ]

        embeddings = self.embedding_service.embed_documents(
            texts
        )

        metadatas = []
        ids = []

        for index, document in enumerate(documents):

            metadata = {
                "scope": "global",
                "document_type": "role",
                "role": role,
                "role_slug": document.metadata.get(
                    "role_slug",
                    "",
                ),
                "source": document.source,
                "section": document.section,

                **{
                    key: value
                    for key, value in document.metadata.items()
                    if key not in {
                        "scope",
                        "document_type",
                        "role",
                    }
                },
            }

            metadatas.append(metadata)

            source_key = (
                document.source
                .replace("\\", "/")
                .replace("/", "_")
            )

            ids.append(
                f"role:"
                f"{role.lower().replace(' ', '_')}:"
                f"{source_key}:"
                f"{index}"
            )

        self.collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    def search_role(
    self,
    query: str,
    role: str,
    top_k: int = 5,
):
        """
        Search only the global knowledge
        belonging to the requested role.
        """

        query_embedding = (
            self.embedding_service.embed_query(query)
        )

        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={
                "$and": [
                    {
                        "scope": "global"
                    },
                    {
                        "document_type": "role"
                    },
                    {
                        "role": role
                    },
                ]
            },
        )

    def delete_role(
    self,
    role: str,
    ):
        """
        Delete all knowledge belonging
        to one role.
        """

        self.collection.delete(
            where={
                "$and": [
                    {
                        "scope": "global"
                    },
                    {
                        "document_type": "role"
                    },
                    {
                        "role": role
                    },
                ]
            }
        )

    def count_role(
    self,
    role: str,
) -> int:

        result = self.collection.get(
            where={
                "$and": [
                    {
                        "scope": "global"
                    },
                    {
                        "document_type": "role"
                    },
                    {
                        "role": role
                    },
                ]
            },
            include=[],
        )

        return len(result["ids"])