from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

sys.path.insert(
    0,
    str(ROOT),
)

from app.services.role_knowledge.loader import (
    RoleKnowledgeLoader,
)

from app.services.role_knowledge.chunker import (
    RoleKnowledgeChunker,
)

from app.services.vectorstore.chroma_store import (
    ChromaStore,
)


def require(
    condition: bool,
    message: str,
):

    if not condition:
        raise AssertionError(message)


def main():

    print(
        "\n=== Phase 3: Role Knowledge Base Test ==="
    )

    # ------------------------------------------
    # 1. LOAD ROLE KNOWLEDGE
    # ------------------------------------------

    loader = RoleKnowledgeLoader(
        "role_knowledge"
    )

    raw_documents = loader.load()

    require(
        bool(raw_documents),
        "No role knowledge documents were loaded.",
    )

    print(
        f"[PASS] Loaded "
        f"{len(raw_documents)} role knowledge files"
    )

    roles = sorted(
        {
            document.metadata["role"]
            for document in raw_documents
        }
    )

    require(
        len(roles) >= 2,
        "Expected at least two roles.",
    )

    print(
        f"[PASS] Roles found: "
        f"{', '.join(roles)}"
    )

    # ------------------------------------------
    # 2. CHUNKING
    # ------------------------------------------

    chunker = RoleKnowledgeChunker(
        max_chars=1200
    )

    chunks = chunker.chunk(
        raw_documents
    )

    require(
        bool(chunks),
        "Chunking produced no documents.",
    )

    require(
        all(
            len(chunk.content) <= 1200
            for chunk in chunks
        ),
        "A chunk exceeds max_chars.",
    )

    print(
        f"[PASS] Created "
        f"{len(chunks)} retrieval chunks"
    )

    # ------------------------------------------
    # 3. CHROMA STORAGE
    # ------------------------------------------

    store = ChromaStore()

    for role in roles:

        role_chunks = [
            chunk
            for chunk in chunks
            if chunk.metadata["role"] == role
        ]

        store.delete_role(role)

        store.add_role_documents(
            role_chunks,
            role,
        )

        count = store.count_role(
            role
        )

        require(
            count > 0,
            f"No Chroma records for {role}",
        )

        print(
            f"[PASS] Stored "
            f"{count} chunks for {role}"
        )

    # ------------------------------------------
    # 4. ROLE FILTER TEST
    # ------------------------------------------

    for role in roles:

        result = store.search_role(
            query="core skills and technologies",
            role=role,
            top_k=5,
        )

        returned_metadata = (
            result["metadatas"][0]
        )

        require(
            bool(returned_metadata),
            f"No retrieval results for {role}",
        )

        for metadata in returned_metadata:

            require(
                metadata["scope"] == "global",
                "Role result is not global.",
            )

            require(
                metadata["document_type"] == "role",
                "Wrong document type.",
            )

            require(
                metadata["role"] == role,
                "Another role leaked into retrieval.",
            )

        print(
            f"[PASS] Role retrieval isolated {role}"
        )

    # ------------------------------------------
    # 5. SEMANTIC RETRIEVAL TEST
    # ------------------------------------------

    if "AI Engineer" in roles:

        result = store.search_role(
            query=(
                "retrieval augmented generation "
                "embeddings vector databases"
            ),
            role="AI Engineer",
            top_k=3,
        )

        retrieved_text = " ".join(
            result["documents"][0]
        ).lower()

        relevant_terms = (
            "rag",
            "retrieval",
            "embedding",
            "vector",
        )

        require(
            any(
                term in retrieved_text
                for term in relevant_terms
            ),
            "Relevant RAG knowledge was not retrieved.",
        )

        print(
            "[PASS] AI Engineer semantic retrieval "
            "returned relevant RAG context"
        )

    print(
        "\nPhase 3 tests completed successfully."
    )


if __name__ == "__main__":
    main()