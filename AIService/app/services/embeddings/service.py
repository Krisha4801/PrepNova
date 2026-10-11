import threading
from typing import Dict, List
from langchain_huggingface import HuggingFaceEmbeddings

_embedding_models: Dict[str, HuggingFaceEmbeddings] = {}
_model_lock = threading.Lock()

def get_huggingface_embeddings(model_name: str = "BAAI/bge-small-en-v1.5") -> HuggingFaceEmbeddings:
    """Thread-safe singleton getter to avoid repeatedly loading HuggingFace model weights per request."""
    if model_name not in _embedding_models:
        with _model_lock:
            if model_name not in _embedding_models:
                _embedding_models[model_name] = HuggingFaceEmbeddings(
                    model_name=model_name,
                    model_kwargs={
                        "device": "cpu"
                    },
                    encode_kwargs={
                        "normalize_embeddings": True
                    }
                )
    return _embedding_models[model_name]

class EmbeddingService:

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self.embeddings = get_huggingface_embeddings(model_name)

    def embed_documents(
        self, 
        texts: List[str],
    ) -> List[List[float]]:
        return self.embeddings.embed_documents(texts)

    def embed_query(
        self, 
        text: str,
    ) -> List[float]:
        return self.embeddings.embed_query(text)