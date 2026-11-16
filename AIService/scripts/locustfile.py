"""
PrepNova AI Service Locust Load Test Suite

Tests:
1. Health check latency (/health)
2. Role knowledge retrieval (/rag/search/role)
3. User document similarity search (/rag/search/user)
4. Vector store document status (/rag/document-status)
5. Structured blueprint planning (/interview/plan-blueprint)

Usage:
  locust -f AIService/scripts/locustfile.py --headless -u 20 -r 5 --run-time 30s --host http://localhost:8000
"""

from locust import HttpUser, task, between
import random

ROLES = [
    "Frontend Engineer",
    "Backend Engineer",
    "Fullstack Engineer",
    "AI Engineer",
    "DevOps Engineer"
]

QUERIES = [
    "Explain indexing and query execution plans in PostgreSQL",
    "How does React virtual DOM reconciliation work?",
    "Describe distributed transactions and the two-phase commit protocol",
    "Explain the attention mechanism in Transformer models",
    "What is the difference between TCP and UDP in network communication?"
]

class AiServiceLoadUser(HttpUser):
    wait_time = between(1, 2)

    @task(3)
    def test_health(self):
        self.client.get("/health", name="/health")

    @task(5)
    def test_search_role_knowledge(self):
        role = random.choice(ROLES)
        query = random.choice(QUERIES)
        payload = {
            "role": role,
            "query": query,
            "top_k": 3
        }
        self.client.post("/rag/search/role", json=payload, name="/rag/search/role")

    @task(2)
    def test_document_status_check(self):
        user_id = f"user_{random.randint(100, 999)}"
        doc_id = f"resume_{random.randint(1000, 9999)}"
        self.client.get(
            f"/rag/document-status?user_id={user_id}&document_id={doc_id}&document_type=resume",
            name="/rag/document-status"
        )

    @task(2)
    def test_plan_blueprint(self):
        role = random.choice(ROLES)
        payload = {
            "role": role,
            "difficulty": "intermediate",
            "target_duration_minutes": 30,
            "question_count_mode": "6",
            "practice_mode": "complete"
        }
        self.client.post("/interview/plan-blueprint", json=payload, name="/interview/plan-blueprint")
