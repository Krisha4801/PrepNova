import unittest
import shutil
import tempfile
from unittest.mock import patch, MagicMock
from app.services.vectorstore.chroma_store import ChromaStore
from app.schemas.document import InterviewDocument

class TestChromaMultiCollections(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        mock_embedding_instance = MagicMock()
        mock_embedding_instance.embed_documents.side_effect = lambda texts: [[0.05] * 384 for _ in texts]
        mock_embedding_instance.embed_query.side_effect = lambda query: [0.05] * 384

        with patch("app.services.vectorstore.chroma_store.EmbeddingService", return_value=mock_embedding_instance):
            self.store = ChromaStore(persist_directory=self.test_dir)

    def tearDown(self):
        try:
            shutil.rmtree(self.test_dir, ignore_errors=True)
        except Exception:
            pass

    def test_three_collections_initialized(self):
        """Verifies that prepnova_resumes, prepnova_jds, and prepnova_role_kb are all instantiated."""
        self.assertIsNotNone(self.store.resume_collection)
        self.assertIsNotNone(self.store.jd_collection)
        self.assertIsNotNone(self.store.role_collection)
        self.assertEqual(self.store.resume_collection.name, "prepnova_resumes")
        self.assertEqual(self.store.jd_collection.name, "prepnova_jds")
        self.assertEqual(self.store.role_collection.name, "prepnova_role_kb")
        # Legacy backward-compatibility alias
        self.assertEqual(self.store.collection.name, "prepnova_resumes")

    def test_has_document_check(self):
        """Verifies accurate existence check without relying on similarity search."""
        user_id = "test_user_1"
        doc_id = "resume_test_100"

        # Initially false
        self.assertFalse(self.store.has_document(user_id=user_id, document_id=doc_id, document_type="resume"))

        # Add document
        docs = [
            InterviewDocument(
                content="Software Engineer with Python and AWS experience.",
                source="resume",
                document_type="resume",
                section="summary"
            )
        ]
        chunks = self.store.add_documents(documents=docs, user_id=user_id, document_id=doc_id)
        self.assertEqual(len(chunks), 1)
        self.assertIn("embedding", chunks[0])
        self.assertEqual(len(chunks[0]["embedding"]), 384)

        # Now true
        self.assertTrue(self.store.has_document(user_id=user_id, document_id=doc_id, document_type="resume"))
        # Different doc id should still be false
        self.assertFalse(self.store.has_document(user_id=user_id, document_id="resume_nonexistent", document_type="resume"))

    def test_idempotent_rehydrate_without_re_embedding(self):
        """Verifies that pre-computed chunks can be rehydrated directly into Chroma without re-embedding."""
        user_id = "test_user_2"
        doc_id = "resume_test_200"

        mock_embedding = [0.05] * 384
        durable_chunks = [
            {
                "chunk_id": f"resume:{user_id}:{doc_id}:0",
                "chunk_index": 0,
                "content": "Built scalable distributed microservices with Kafka and Go.",
                "section": "experience",
                "embedding": mock_embedding,
                "metadata": {"experience_index": 0}
            }
        ]

        count = self.store.rehydrate_chunks(
            chunks=durable_chunks,
            user_id=user_id,
            document_id=doc_id,
            document_type="resume"
        )
        self.assertEqual(count, 1)
        self.assertTrue(self.store.has_document(user_id=user_id, document_id=doc_id, document_type="resume"))

        # Re-rehydrating should be idempotent (same count, no duplicate IDs)
        count_repeat = self.store.rehydrate_chunks(
            chunks=durable_chunks,
            user_id=user_id,
            document_id=doc_id,
            document_type="resume"
        )
        self.assertEqual(count_repeat, 1)
        self.assertEqual(self.store.resume_collection.count(), 1)

    def test_search_routing_by_prefix(self):
        """Verifies that search routes to prepnova_jds for jd_ prefix and prepnova_resumes otherwise."""
        user_id = "user_router_test"
        jd_id = "jd_999"
        res_id = "resume_999"

        # Add JD
        self.store.add_documents(
            documents=[InterviewDocument(content="Kubernetes expert needed", source="jd", document_type="jd", section="skills")],
            user_id=user_id,
            document_id=jd_id,
            document_type="jd"
        )
        # Add Resume
        self.store.add_documents(
            documents=[InterviewDocument(content="React developer with 5 years exp", source="resume", document_type="resume", section="summary")],
            user_id=user_id,
            document_id=res_id,
            document_type="resume"
        )

        self.assertEqual(self.store.jd_collection.count(), 1)
        self.assertEqual(self.store.resume_collection.count(), 1)

        # Query JD specifically
        jd_res = self.store.search(query="Kubernetes", user_id=user_id, document_id=jd_id)
        self.assertTrue(len(jd_res["documents"][0]) > 0)
        self.assertIn("Kubernetes", jd_res["documents"][0][0])

        # Query Resume specifically
        res_res = self.store.search(query="React", user_id=user_id, document_id=res_id)
        self.assertTrue(len(res_res["documents"][0]) > 0)
        self.assertIn("React", res_res["documents"][0][0])

if __name__ == "__main__":
    unittest.main()
