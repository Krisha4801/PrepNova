from fastapi import APIRouter, HTTPException, status
from app.schemas.rag import (
    UserSearchRequest,
    RoleSearchRequest,
    DeleteDocumentRequest,
    SearchResponse,
    SearchResultItem
)
from app.services.vectorstore.retrieval import RetrievalService
from app.services.vectorstore.chroma_store import ChromaStore

router = APIRouter(
    prefix="/rag",
    tags=["RAG"],
)

retrieval_service = RetrievalService()
chroma_store = ChromaStore()


@router.post("/search/user", response_model=SearchResponse)
async def search_user_documents(request: UserSearchRequest):
    """
    Search private user documents (resumes, uploaded JDs) stored in ChromaDB.
    Strictly scoped to the requested user_id.
    """
    if not request.user_id or not request.user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required."
        )

    try:
        raw_results = retrieval_service.retrieve(
            query=request.query,
            user_id=request.user_id,
            document_id=request.document_id,
            top_k=request.top_k,
        )

        items = []
        if raw_results and "documents" in raw_results and raw_results["documents"]:
            docs = raw_results["documents"][0] if raw_results["documents"] else []
            metas = raw_results.get("metadatas", [[]])[0] if raw_results.get("metadatas") else []
            dists = raw_results.get("distances", [[]])[0] if raw_results.get("distances") else []

            for i, doc in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                dist = dists[i] if i < len(dists) else None
                items.append(SearchResultItem(
                    content=doc,
                    metadata=meta,
                    distance=dist
                ))

        return SearchResponse(
            success=True,
            query=request.query,
            results=items,
            count=len(items)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing similarity search: {str(e)}"
        )


@router.post("/search/role", response_model=SearchResponse)
async def search_role_knowledge(request: RoleSearchRequest):
    """
    Search global curated role knowledge in ChromaDB for the specified role.
    """
    if not request.role or not request.role.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="role is required."
        )

    try:
        raw_results = retrieval_service.retrieve_role(
            query=request.query,
            role=request.role,
            top_k=request.top_k,
        )

        items = []
        if raw_results and "documents" in raw_results and raw_results["documents"]:
            docs = raw_results["documents"][0] if raw_results["documents"] else []
            metas = raw_results.get("metadatas", [[]])[0] if raw_results.get("metadatas") else []
            dists = raw_results.get("distances", [[]])[0] if raw_results.get("distances") else []

            for i, doc in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                dist = dists[i] if i < len(dists) else None
                items.append(SearchResultItem(
                    content=doc,
                    metadata=meta,
                    distance=dist
                ))

        return SearchResponse(
            success=True,
            query=request.query,
            results=items,
            count=len(items)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing role similarity search: {str(e)}"
        )


@router.delete("/documents")
async def delete_user_document(request: DeleteDocumentRequest):
    """
    Delete a specific document and its vector chunks for a user.
    """
    if not request.user_id or not request.document_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id and document_id are required."
        )

    try:
        chroma_store.delete_document(
            user_id=request.user_id,
            document_id=request.document_id
        )
        return {
            "success": True,
            "message": f"Document {request.document_id} deleted successfully."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )


@router.get("/stats")
async def get_rag_stats():
    """
    Retrieve stats on the vector store.
    """
    try:
        count = chroma_store.count()
        return {
            "status": "ok",
            "total_documents": count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve vector store stats: {str(e)}"
        )
