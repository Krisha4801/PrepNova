import threading
from pathlib import Path
from typing import List, Optional, Dict, Any
import chromadb
from app.schemas.document import InterviewDocument
from app.services.embeddings.service import EmbeddingService

_chroma_clients: Dict[str, chromadb.PersistentClient] = {}
_chroma_client_lock = threading.Lock()

def get_chroma_client(persist_directory: str = "data/chroma") -> chromadb.PersistentClient:
    """Thread-safe persistent ChromaDB client reuse."""
    norm_path = str(Path(persist_directory).resolve())
    if norm_path not in _chroma_clients:
        with _chroma_client_lock:
            if norm_path not in _chroma_clients:
                Path(persist_directory).mkdir(parents=True, exist_ok=True)
                _chroma_clients[norm_path] = chromadb.PersistentClient(path=persist_directory)
    return _chroma_clients[norm_path]

class ChromaStore:
    """
    Manages three dedicated vector collections in ChromaDB:
    - prepnova_resumes: Candidate resume chunks and vectors
    - prepnova_jds: Job description chunks and vectors
    - prepnova_role_kb: Global curated role knowledge base
    
    Provides backward-compatible single collection routing (via self.collection alias)
    and zero-re-embedding idempotent rehydration.
    """

    def __init__(
        self,
        persist_directory: str = "data/chroma",
        collection_name: str = "prep_nova",
    ):
        Path(persist_directory).mkdir(parents=True, exist_ok=True)
        self.client = get_chroma_client(persist_directory)

        # 1. Three Dedicated Logical Collections
        self.resume_collection = self.client.get_or_create_collection(
            name="prepnova_resumes",
            metadata={"description": "PrepNova candidate resume chunks and vectors"}
        )
        self.jd_collection = self.client.get_or_create_collection(
            name="prepnova_jds",
            metadata={"description": "PrepNova job description chunks and vectors"}
        )
        self.role_collection = self.client.get_or_create_collection(
            name="prepnova_role_kb",
            metadata={"description": "PrepNova global curated role knowledge base"}
        )

        # Legacy / Backward-compatibility alias
        self.legacy_collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"description": "PrepNova searchable documents (legacy)"}
        )
        self.collection = self.resume_collection

        self.embedding_service = EmbeddingService()

    def _get_target_collection(self, document_type: Optional[str] = None, document_id: Optional[str] = None):
        """Resolves whether a document belongs to resumes or JDs."""
        dt = (document_type or "").lower().strip()
        did = (document_id or "").lower().strip()

        if dt in ["jd", "job_description"] or did.startswith("jd_"):
            return self.jd_collection
        return self.resume_collection

    # =========================================================
    # ADD DOCUMENTS & RETURN COMPUTED CHUNKS + EMBEDDINGS
    # =========================================================

    def add_documents(
        self,
        documents: List[InterviewDocument],
        user_id: str,
        document_id: str,
        document_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Embeds and stores documents in the dedicated collection.
        Returns a list of chunk dictionaries (including 384-d embeddings)
        so they can be durably persisted to MongoDB.
        """
        if not documents:
            return []

        doc_type = document_type or documents[0].document_type or ("jd" if document_id.startswith("jd_") else "resume")
        target_collection = self._get_target_collection(doc_type, document_id)

        texts = [doc.content for doc in documents]
        embeddings = self.embedding_service.embed_documents(texts)

        metadatas = []
        ids = []
        result_chunks = []

        for index, document in enumerate(documents):
            chunk_id = f"{doc_type}:{user_id}:{document_id}:{index}"
            metadata = {
                "scope": "user",
                "user_id": user_id,
                "document_id": document_id,
                "source": document.source,
                "document_type": doc_type,
                "section": document.section,
                "chunk_index": index,
                **document.metadata,
            }
            metadatas.append(metadata)
            ids.append(chunk_id)

            result_chunks.append({
                "chunk_id": chunk_id,
                "chunk_index": index,
                "content": document.content,
                "section": document.section,
                "embedding": embeddings[index],
                "metadata": metadata,
            })

        # Upsert into dedicated collection
        target_collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        # Also mirror to legacy collection for backwards compatibility if needed
        try:
            self.legacy_collection.upsert(
                ids=ids,
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
            )
        except Exception:
            pass

        return result_chunks

    # =========================================================
    # IDEMPOTENT DOCUMENT REHYDRATION
    # =========================================================

    def has_document(self, user_id: str, document_id: str, document_type: Optional[str] = None) -> bool:
        """
        Checks whether the document's chunks exist in the vector store.
        Does NOT rely on search results.
        """
        target = self._get_target_collection(document_type, document_id)
        try:
            res = target.get(
                where={
                    "$and": [
                        {"scope": "user"},
                        {"user_id": user_id},
                        {"document_id": document_id},
                    ]
                },
                limit=1,
            )
            return len(res.get("ids", [])) > 0
        except Exception:
            return False

    def rehydrate_chunks(
        self,
        chunks: List[Dict[str, Any]],
        user_id: str,
        document_id: str,
        document_type: Optional[str] = None,
    ) -> int:
        """
        Restores vectors from MongoDB durable chunks directly into ChromaDB.
        Idempotent: Uses exact deterministic chunk IDs.
        Fast: Reuses pre-computed embeddings without calling HuggingFace model.
        """
        if not chunks:
            return 0

        doc_type = document_type or ("jd" if document_id.startswith("jd_") else "resume")
        target_collection = self._get_target_collection(doc_type, document_id)

        ids = []
        documents = []
        embeddings = []
        metadatas = []

        for chunk in chunks:
            c_idx = chunk.get("chunk_index", 0)
            c_id = chunk.get("chunk_id") or f"{doc_type}:{user_id}:{document_id}:{c_idx}"
            ids.append(c_id)
            documents.append(chunk.get("content", ""))
            embeddings.append(chunk.get("embedding", []))
            
            meta = {
                "scope": "user",
                "user_id": user_id,
                "document_id": document_id,
                "document_type": doc_type,
                "section": chunk.get("section", "general"),
                "chunk_index": c_idx,
                **(chunk.get("metadata") or {}),
            }
            metadatas.append(meta)

        target_collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        return len(ids)

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
        """
        Searches user-scoped collections using cosine similarity.
        Routes to prepnova_jds, prepnova_resumes, or queries both if document_id is omitted.
        """
        query_embedding = self.embedding_service.embed_query(query)

        if document_id:
            target = self._get_target_collection(None, document_id)
            where = {
                "$and": [
                    {"scope": "user"},
                    {"user_id": user_id},
                    {"document_id": document_id},
                ]
            }
            res = target.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where,
            )
            # If not found in primary target, check legacy collection as fallback
            if not res or not res.get("documents") or not res["documents"][0]:
                fallback_res = self.legacy_collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    where=where,
                )
                if fallback_res and fallback_res.get("documents") and fallback_res["documents"][0]:
                    return fallback_res
            return res

        # If document_id is None: Search both resumes and JDs and merge top matches
        where_user = {
            "$and": [
                {"scope": "user"},
                {"user_id": user_id},
            ]
        }

        res_resumes = self.resume_collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_user,
        )
        res_jds = self.jd_collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_user,
        )

        # Merge results based on distance
        docs = []
        metas = []
        dists = []
        ids = []

        for res in [res_resumes, res_jds]:
            if res and res.get("documents") and res["documents"][0]:
                docs.extend(res["documents"][0])
                metas.extend(res["metadatas"][0] if res.get("metadatas") else [])
                dists.extend(res["distances"][0] if res.get("distances") else [])
                ids.extend(res["ids"][0] if res.get("ids") else [])

        if not docs:
            # Fallback to legacy
            return self.legacy_collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_user,
            )

        # Sort by distance (lower is closer in cosine distance)
        combined = sorted(zip(docs, metas, dists, ids), key=lambda x: x[2] if x[2] is not None else 999.0)
        top = combined[:top_k]

        return {
            "documents": [[x[0] for x in top]],
            "metadatas": [[x[1] for x in top]],
            "distances": [[x[2] for x in top]],
            "ids": [[x[3] for x in top]],
        }

    # =========================================================
    # DELETE DOCUMENT
    # =========================================================

    def delete_document(
        self,
        user_id: str,
        document_id: str,
    ):
        """Deletes document chunks from all user collections."""
        where = {
            "$and": [
                {"scope": "user"},
                {"user_id": user_id},
                {"document_id": document_id},
            ]
        }
        for coll in [self.resume_collection, self.jd_collection, self.legacy_collection]:
            try:
                coll.delete(where=where)
            except Exception:
                pass

    # =========================================================
    # COUNT
    # =========================================================

    def count(self) -> int:
        """Returns total documents across resume and JD collections."""
        return self.resume_collection.count() + self.jd_collection.count()

    # =========================================================
    # ROLE DOCUMENTS (prepnova_role_kb)
    # =========================================================

    def add_role_documents(
        self,
        documents: list[InterviewDocument],
        role: str,
    ):
        """Store global role knowledge documents in prepnova_role_kb."""
        if not documents:
            return

        texts = [document.content for document in documents]
        embeddings = self.embedding_service.embed_documents(texts)

        metadatas = []
        ids = []

        for index, document in enumerate(documents):
            metadata = {
                "scope": "global",
                "document_type": "role",
                "role": role,
                "role_slug": document.metadata.get("role_slug", ""),
                "source": document.source,
                "section": document.section,
                **{
                    key: value
                    for key, value in document.metadata.items()
                    if key not in {"scope", "document_type", "role"}
                },
            }
            metadatas.append(metadata)

            source_key = document.source.replace("\\", "/").replace("/", "_")
            ids.append(f"role:{role.lower().replace(' ', '_')}:{source_key}:{index}")

        self.role_collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    @staticmethod
    def normalize_role(role: str) -> str:
        r = (role or "").strip().lower().replace("_", " ").replace("-", " ")
        if any(k in r for k in ["front", "ui", "react", "web dev"]):
            return "Frontend Engineer"
        if any(k in r for k in ["back", "api", "node dev", "server"]):
            return "Backend Engineer"
        if any(k in r for k in ["full", "mern", "mean"]):
            return "Fullstack Engineer"
        if any(k in r for k in ["ai", "ml", "machine learning", "artificial intelligence", "aiml"]):
            return "AI Engineer"
        if any(k in r for k in ["devops", "sre", "platform engineer"]):
            return "DevOps Engineer"
        if any(k in r for k in ["data sci", "data anal", "data eng", "data"]):
            return "Data Scientist"
        if any(k in r for k in ["cloud", "aws", "azure", "gcp"]):
            return "Cloud Engineer"
        if any(k in r for k in ["qa", "test", "quality", "sdet"]):
            return "QA Engineer"
        return role.strip()

    def search_role(
        self,
        query: str,
        role: str,
        top_k: int = 5,
    ):
        """Search global knowledge belonging to the requested role in prepnova_role_kb."""
        query_embedding = self.embedding_service.embed_query(query)

        target_roles = [role]
        norm = self.normalize_role(role)
        if norm and norm not in target_roles:
            target_roles.append(norm)

        for candidate_role in target_roles:
            results = self.role_collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where={
                    "$and": [
                        {"scope": "global"},
                        {"document_type": "role"},
                        {"role": candidate_role},
                    ]
                },
            )
            if results and results.get("documents") and results["documents"][0]:
                return results

        # Broad fallback if no specific role documents matched: search any global role documents
        return self.role_collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={
                "$and": [
                    {"scope": "global"},
                    {"document_type": "role"},
                ]
            },
        )

    def delete_role(self, role: str):
        """Delete all knowledge belonging to one role from prepnova_role_kb."""
        self.role_collection.delete(
            where={
                "$and": [
                    {"scope": "global"},
                    {"document_type": "role"},
                    {"role": role},
                ]
            }
        )

    def count_role(self, role: str) -> int:
        """Count role documents in prepnova_role_kb."""
        result = self.role_collection.get(
            where={
                "$and": [
                    {"scope": "global"},
                    {"document_type": "role"},
                    {"role": role},
                ]
            },
            include=[],
        )
        return len(result["ids"])
