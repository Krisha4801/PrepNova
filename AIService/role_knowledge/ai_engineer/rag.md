# Retrieval-Augmented Generation

RAG combines retrieval with generation.

A typical RAG pipeline:

1. Load source content
2. Split content into chunks
3. Generate embeddings
4. Store embeddings in a vector database
5. Convert the user query into an embedding
6. Retrieve relevant chunks
7. Provide the retrieved context to an LLM
8. Generate a grounded response

Important RAG concepts include:

- chunking strategy
- embedding models
- metadata filtering
- similarity search
- top-k retrieval
- context construction
- grounding
- retrieval evaluation
- generation evaluation