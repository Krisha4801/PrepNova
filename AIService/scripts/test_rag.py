from app.schemas.resume import Resume

from app.services.processing.chunker import (
    resume_to_documents,
)

from app.services.vectorstore.chroma_store import (
    ChromaStore,
)


def create_resume(
    name: str,
    skills: list[str],
):

    return Resume(
        candidate_info={
            "name": name,
            "email": f"{name.lower().replace(' ', '')}@example.com",
        },
        education=[],
        experience=[],
        skills=skills,
        projects=[],
    )


def main():

    store = ChromaStore()

    # =========================================================
    # USER A
    # =========================================================

    user_a = "user_A"
    resume_a = "resume_A"

    resume_a_data = create_resume(
        "Alice",
        [
            "Python",
            "FastAPI",
            "LangChain",
            "RAG",
        ],
    )

    documents_a = resume_to_documents(
        resume_a_data
    )

    store.add_documents(
        documents=documents_a,
        user_id=user_a,
        document_id=resume_a,
    )

    # =========================================================
    # USER B
    # =========================================================

    user_b = "user_B"
    resume_b = "resume_B"

    resume_b_data = create_resume(
        "Bob",
        [
            "Java",
            "Spring Boot",
            "Docker",
            "Kubernetes",
        ],
    )

    documents_b = resume_to_documents(
        resume_b_data
    )

    store.add_documents(
        documents=documents_b,
        user_id=user_b,
        document_id=resume_b,
    )

    # =========================================================
    # USER A SEARCH
    # =========================================================

    print("\n==============================")
    print("USER A SEARCH")
    print("==============================")

    results_a = store.search(
        query="What programming skills does the candidate have?",
        user_id=user_a,
        document_id=resume_a,
        top_k=5,
    )

    for document, metadata in zip(
        results_a["documents"][0],
        results_a["metadatas"][0],
    ):

        print("\nDocument:")
        print(document)

        print("Metadata:")
        print(metadata)

    # =========================================================
    # USER B SEARCH
    # =========================================================

    print("\n==============================")
    print("USER B SEARCH")
    print("==============================")

    results_b = store.search(
        query="What programming skills does the candidate have?",
        user_id=user_b,
        document_id=resume_b,
        top_k=5,
    )

    for document, metadata in zip(
        results_b["documents"][0],
        results_b["metadatas"][0],
    ):

        print("\nDocument:")
        print(document)

        print("Metadata:")
        print(metadata)


if __name__ == "__main__":
    main()