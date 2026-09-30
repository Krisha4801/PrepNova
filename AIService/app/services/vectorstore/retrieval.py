from app.services.vectorstore.chroma_store import (
    ChromaStore
)

class RetrievalService:

    def __init__(self):
        self.store = ChromaStore()

    def retrieve(
        self,
        query: str,
        user_id: str, 
        document_id: str | None = None,
        top_k: int = 5
    ):

        return self.store.search(
            query=query,
            user_id=user_id,
            document_id=document_id,
            top_k=top_k,
        )

        def retrieve_role(
        self,
        query: str,
        role: str,
        top_k: int = 5,
    ):

            return self.store.search_role(
                query=query,
                role=role,
                top_k=top_k,
            )