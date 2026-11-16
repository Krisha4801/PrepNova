import os
import unittest
import shutil
import tempfile
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.services.vectorstore.chroma_store import ChromaStore
from app.schemas.document import InterviewDocument
from app.core.security import verify_ai_service_key
from fastapi import HTTPException

class TestChromaDurabilityAndSecurity(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.mock_embedding = MagicMock()
        self.mock_embedding.embed_documents.side_effect = lambda texts: [[0.05] * 384 for _ in texts]
        self.mock_embedding.embed_query.side_effect = lambda query: [0.05] * 384

        with patch("app.services.vectorstore.chroma_store.EmbeddingService", return_value=self.mock_embedding):
            self.store = ChromaStore(persist_directory=self.test_dir)

    def tearDown(self):
        try:
            shutil.rmtree(self.test_dir, ignore_errors=True)
        except Exception:
            pass

    def test_all_three_collections_present(self):
        """1. Verify all three distinct collections are maintained."""
        self.assertEqual(self.store.resume_collection.name, "prepnova_resumes")
        self.assertEqual(self.store.jd_collection.name, "prepnova_jds")
        self.assertEqual(self.store.role_collection.name, "prepnova_role_kb")

    def test_resume_and_jd_indexing_and_isolation(self):
        """2. Verify resume and JD indexing, 384-d vector embeddings, and strict tenant isolation."""
        user_a = "user_alpha"
        user_b = "user_beta"
        resume_id = "resume_alpha_01"
        jd_id = "jd_alpha_01"

        # Index Resume for User A
        resume_docs = [InterviewDocument(content="Alice: Senior React Engineer with Redux expertise.", source="resume", document_type="resume", section="skills")]
        chunks_r = self.store.add_documents(documents=resume_docs, user_id=user_a, document_id=resume_id, document_type="resume")
        self.assertEqual(len(chunks_r), 1)
        self.assertEqual(len(chunks_r[0]["embedding"]), 384)

        # Index JD for User A
        jd_docs = [InterviewDocument(content="Senior Fullstack Job: Requires React and Node.js.", source="jd", document_type="jd", section="requirements")]
        chunks_j = self.store.add_documents(documents=jd_docs, user_id=user_a, document_id=jd_id, document_type="jd")
        self.assertEqual(len(chunks_j), 1)
        self.assertEqual(len(chunks_j[0]["embedding"]), 384)

        # Verify existence
        self.assertTrue(self.store.has_document(user_a, resume_id, "resume"))
        self.assertTrue(self.store.has_document(user_a, jd_id, "jd"))

        # Strict Tenant Isolation: User B cannot retrieve User A's resume or JD
        res_b = self.store.search(query="React", user_id=user_b, document_id=resume_id)
        self.assertEqual(len(res_b["documents"][0]), 0)

        res_b_all = self.store.search(query="React", user_id=user_b)
        self.assertEqual(len(res_b_all["documents"][0]), 0)

    def test_simulated_restart_and_idempotent_rehydration(self):
        """3. Simulate ephemeral container wipe and verify zero-loss recovery from pre-computed chunks."""
        user_id = "user_gamma"
        doc_id = "resume_gamma_01"
        mock_vector = [0.03] * 384
        stored_mongo_chunks = [
            {
                "chunk_id": f"resume:{user_id}:{doc_id}:0",
                "chunk_index": 0,
                "content": "Staff Platform Engineer with Kubernetes and Terraform.",
                "section": "experience",
                "embedding": mock_vector,
                "metadata": {"experience_index": 0}
            }
        ]

        # Container restarts: new empty directory
        fresh_dir = tempfile.mkdtemp()
        try:
            with patch("app.services.vectorstore.chroma_store.EmbeddingService", return_value=self.mock_embedding):
                new_store = ChromaStore(persist_directory=fresh_dir)

            # Initially not present
            self.assertFalse(new_store.has_document(user_id, doc_id, "resume"))

            # Rehydrate from MongoDB durable chunks
            rehydrated_count = new_store.rehydrate_chunks(
                chunks=stored_mongo_chunks,
                user_id=user_id,
                document_id=doc_id,
                document_type="resume"
            )
            self.assertEqual(rehydrated_count, 1)
            self.assertTrue(new_store.has_document(user_id, doc_id, "resume"))

            # Verify retrieval works on rehydrated vectors
            search_res = new_store.search(query="Kubernetes", user_id=user_id, document_id=doc_id)
            self.assertEqual(len(search_res["documents"][0]), 1)
            self.assertIn("Kubernetes", search_res["documents"][0][0])

            # Test Idempotency: Re-rehydrating does not create duplicates
            rehydrated_again = new_store.rehydrate_chunks(
                chunks=stored_mongo_chunks,
                user_id=user_id,
                document_id=doc_id,
                document_type="resume"
            )
            self.assertEqual(rehydrated_again, 1)
            self.assertEqual(new_store.resume_collection.count(), 1)
        finally:
            shutil.rmtree(fresh_dir, ignore_errors=True)

    def test_document_deletion(self):
        """4. Verify document deletion cleans up vectors across collections."""
        user_id = "user_delta"
        doc_id = "resume_delta_01"
        docs = [InterviewDocument(content="Temporary candidate record", source="resume", document_type="resume", section="summary")]
        self.store.add_documents(documents=docs, user_id=user_id, document_id=doc_id)
        self.assertTrue(self.store.has_document(user_id, doc_id))

        self.store.delete_document(user_id=user_id, document_id=doc_id)
        self.assertFalse(self.store.has_document(user_id, doc_id))

    def test_partial_failure_and_recovery(self):
        """5. Verify handling of partial indexing failures and subsequent recovery."""
        user_id = "user_partial"
        doc_id = "resume_partial_01"

        # Chunk with empty content or valid content
        valid_chunk = {
            "chunk_id": f"resume:{user_id}:{doc_id}:0",
            "chunk_index": 0,
            "content": "Valid resume content for chunk 0",
            "section": "summary",
            "embedding": [0.02] * 384,
            "metadata": {}
        }
        # First partial index succeeds
        count1 = self.store.rehydrate_chunks(
            chunks=[valid_chunk],
            user_id=user_id,
            document_id=doc_id,
            document_type="resume"
        )
        self.assertEqual(count1, 1)
        self.assertTrue(self.store.has_document(user_id, doc_id, "resume"))

        # Second chunk added during recovery
        recovered_chunk = {
            "chunk_id": f"resume:{user_id}:{doc_id}:1",
            "chunk_index": 1,
            "content": "Recovered chunk 1 after network retry",
            "section": "experience",
            "embedding": [0.04] * 384,
            "metadata": {}
        }
        count2 = self.store.rehydrate_chunks(
            chunks=[valid_chunk, recovered_chunk],
            user_id=user_id,
            document_id=doc_id,
            document_type="resume"
        )
        self.assertEqual(count2, 2)
        # Search sees both chunks
        res = self.store.search(query="Recovered", user_id=user_id, document_id=doc_id)
        self.assertGreaterEqual(len(res["documents"][0]), 1)

    def test_rehydrate_endpoint_security_unit(self):
        """5. Direct unit verification of verify_ai_service_key authorization logic."""
        with patch.dict(os.environ, {"AI_SERVICE_API_KEY": "secret-auth-key-999"}):
            # Missing key -> raises 401
            with self.assertRaises(HTTPException) as ctx:
                verify_ai_service_key(x_ai_service_key=None, authorization=None)
            self.assertEqual(ctx.exception.status_code, 401)

            # Invalid key -> raises 401
            with self.assertRaises(HTTPException) as ctx:
                verify_ai_service_key(x_ai_service_key="wrong-key", authorization=None)
            self.assertEqual(ctx.exception.status_code, 401)

            # Valid X-AI-Service-Key -> True
            res = verify_ai_service_key(x_ai_service_key="secret-auth-key-999", authorization=None)
            self.assertTrue(res)

            # Valid Bearer token -> True
            res_bearer = verify_ai_service_key(x_ai_service_key=None, authorization="Bearer secret-auth-key-999")
            self.assertTrue(res_bearer)

if __name__ == "__main__":
    unittest.main()
