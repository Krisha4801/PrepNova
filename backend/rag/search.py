from sentence_transformers import SentenceTransformer
import faiss, pickle, sys, os, json
from difflib import get_close_matches

AVAILABLE_ROLES = ["frontend", "backend", "fullstack", "devops", "data", "aiml", "cloud", "hr", "finance", "manager"]

def resolve_role(user_role):
    if not user_role:
        return None
    user_role = user_role.lower()
    match = get_close_matches(user_role, AVAILABLE_ROLES, n=1, cutoff=0.6)
    return match[0] if match else None


# ---------- PATHS ----------
BASE = os.path.dirname(__file__)
TEXTS_PATH = os.path.join(BASE, "texts.pkl")

# ---------- INPUT ----------
user_role = sys.argv[1] if len(sys.argv) > 1 else None
level = sys.argv[2] if len(sys.argv) > 2 else None

resolved_role = resolve_role(user_role)

if not resolved_role or not level:
    print("__FALLBACK_TO_GPT__")
    sys.exit(0)

level = level.lower()

# ---------- LOAD DATA ----------
texts = pickle.load(open(TEXTS_PATH, "rb"))

# ---------- FILTER BY ROLE + LEVEL ----------
filtered_texts = [
    t for t in texts
    if f"[{resolved_role}]" in t.lower() and f"[{level}]" in t.lower()
]


if not filtered_texts:
    print("__FALLBACK_TO_GPT__")
    sys.exit(0)

# ---------- VECTOR SEARCH ----------
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(filtered_texts)

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

query = f"{resolved_role} {level} interview question"
q_emb = model.encode([query])

D, I = index.search(q_emb, 1)

print(json.dumps({
    "source": "txt",
    "question": filtered_texts[I[0][0]]
}))
