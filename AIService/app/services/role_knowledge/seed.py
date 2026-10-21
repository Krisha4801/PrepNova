import logging
from app.services.role_knowledge.loader import RoleKnowledgeLoader
from app.services.role_knowledge.chunker import RoleKnowledgeChunker
from app.services.vectorstore.chroma_store import ChromaStore

logger = logging.getLogger(__name__)

def seed_role_knowledge(force: bool = False) -> dict:
    """
    Ensures all curated role knowledge markdown files are indexed into ChromaDB
    under scope='global' and document_type='role'.
    """
    store = ChromaStore()
    loader = RoleKnowledgeLoader()
    chunker = RoleKnowledgeChunker(max_chars=1200)

    try:
        raw_documents = loader.load()
    except Exception as e:
        logger.warning(f"Failed to load role knowledge files: {e}")
        return {"status": "error", "message": str(e), "roles_seeded": 0}

    if not raw_documents:
        return {"status": "empty", "roles_seeded": 0}

    chunks = chunker.chunk(raw_documents)
    roles = sorted({doc.metadata["role"] for doc in raw_documents if "role" in doc.metadata})

    total_chunks_added = 0
    seeded_roles = []

    for role in roles:
        existing_count = store.count_role(role)
        if existing_count == 0 or force:
            role_chunks = [c for c in chunks if c.metadata.get("role") == role]
            if existing_count > 0:
                store.delete_role(role)
            store.add_role_documents(role_chunks, role=role)
            total_chunks_added += len(role_chunks)
            seeded_roles.append(role)
            logger.info(f"Seeded {len(role_chunks)} chunks for role '{role}'")

    return {
        "status": "success",
        "roles_available": roles,
        "roles_seeded": seeded_roles,
        "total_chunks_added": total_chunks_added,
    }
