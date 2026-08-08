from sentence_transformers import SentenceTransformer
import faiss, os, pickle

model = SentenceTransformer("all-MiniLM-L6-v2")

texts = []

# Load all .txt files
for file in os.listdir("backend/rag"):
    if file.endswith(".txt"):
        with open("backend/rag/" + file, "r", encoding="utf-8") as f:
            texts.extend(f.readlines())

embeddings = model.encode(texts)

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

faiss.write_index(index, "backend/rag/index.faiss")
pickle.dump(texts, open("backend/rag/texts.pkl", "wb"))

print("RAG index built successfully")
