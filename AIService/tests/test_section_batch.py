import unittest
from unittest.mock import patch, MagicMock
from app.schemas.interview import SectionBatchRequest
from app.services.interview.graph import (
    generate_section_batch,
    clean_conversational_filler,
    get_section_fallback_questions
)


class TestSectionBatchGeneration(unittest.TestCase):
    def test_clean_conversational_filler(self):
        """Verify that repetitive acknowledgments and conversational filler are stripped."""
        cases = [
            ("Okay, thank you for sharing that. How would you design pagination?", "How would you design pagination?"),
            ("Great, that's interesting! Based on what you just said, what trade-offs led to Redis?", "What trade-offs led to Redis?"),
            ("Thanks for your answer. What security measures do you take?", "What security measures do you take?"),
            ("Understood, that makes sense. Can you explain your concurrency model?", "Can you explain your concurrency model?"),
            ("As you mentioned earlier, how does the system scale?", "How does the system scale?"),
            ("What trade-offs led you to choose Redis for caching?", "What trade-offs led you to choose Redis for caching?")
        ]
        for raw, expected in cases:
            cleaned = clean_conversational_filler(raw)
            self.assertEqual(cleaned, expected, f"Failed cleaning: '{raw}' -> got '{cleaned}'")

    def test_generate_introduction_batch(self):
        """Verify introduction section batch always yields exactly 1 self-introduction question."""
        req = SectionBatchRequest(
            session_id="test_sess_intro",
            section_id="introduction",
            generation_mode="6",
            planned_primary_question_count=6,  # Even if 6 requested, intro is strictly 1
            role="Backend Engineer",
            difficulty="intermediate"
        )
        res = generate_section_batch(req)
        self.assertEqual(res.sectionId, "introduction")
        self.assertEqual(len(res.questions), 1)
        q = res.questions[0]
        self.assertEqual(q.order, 1)
        self.assertEqual(q.type, "primary")
        self.assertEqual(q.status, "pending")
        self.assertEqual(q.sectionId, "introduction")
        self.assertIn("introduce yourself", q.text.lower())

    @patch("app.services.interview.graph.LLMClient")
    def test_generate_section_batches_per_section_counts(self, mock_llm_client):
        """Verify each section type generates primary questions for that section only (deterministic fallback)."""
        mock_instance = MagicMock()
        mock_instance.get_llm.side_effect = Exception("LLM offline in test")
        mock_llm_client.return_value = mock_instance

        sections_to_test = ["projects", "experience", "skills", "technical_concepts", "scenario", "behavioral"]

        for sec in sections_to_test:
            for count in [3, 6]:
                req = SectionBatchRequest(
                    session_id=f"test_sess_{sec}_{count}",
                    section_id=sec,
                    generation_mode=str(count),
                    planned_primary_question_count=count,
                    role="Fullstack Engineer",
                    difficulty="intermediate"
                )
                res = generate_section_batch(req)
                self.assertEqual(res.sectionId, sec)
                self.assertEqual(len(res.questions), count, f"Section {sec} did not produce {count} questions")

                for idx, q in enumerate(res.questions):
                    self.assertEqual(q.sectionId, sec, f"Question sectionId {q.sectionId} != {sec}")
                    self.assertEqual(q.order, idx + 1)
                    self.assertEqual(q.type, "primary")
                    self.assertEqual(q.status, "pending")
                    self.assertGreater(len(q.text), 15)

                    # Verify no conversational filler
                    self.assertFalse(q.text.lower().startswith("okay"), f"Question started with filler: {q.text}")
                    self.assertFalse(q.text.lower().startswith("thank you"), f"Question started with filler: {q.text}")
                    self.assertFalse(q.text.lower().startswith("great,"), f"Question started with filler: {q.text}")

    @patch("app.services.interview.graph.LLMClient")
    def test_generate_section_batch_with_mocked_llm(self, mock_llm_client):
        """Verify section batch correctly parses, validates, and cleans LLM-generated questions."""
        mock_llm = MagicMock()
        mock_resp = MagicMock()
        mock_resp.content = """[
            {
                "order": 1,
                "objective": "Assess Redis caching trade-offs",
                "difficulty": "intermediate",
                "text": "Okay, thank you for sharing that. What trade-offs led you to choose Redis for caching?",
                "context_references": ["resume"]
            },
            {
                "order": 2,
                "objective": "Assess race condition mitigation",
                "difficulty": "intermediate",
                "text": "How do you prevent race conditions when updating shared state concurrently?",
                "context_references": ["resume"]
            },
            {
                "order": 3,
                "objective": "Assess cache invalidation strategy",
                "difficulty": "intermediate",
                "text": "What cache invalidation strategy did you implement for frequent data updates?",
                "context_references": ["resume"]
            }
        ]"""
        mock_llm.invoke.return_value = mock_resp
        mock_instance = MagicMock()
        mock_instance.get_llm.return_value = mock_llm
        mock_llm_client.return_value = mock_instance

        req = SectionBatchRequest(
            session_id="test_sess_llm",
            section_id="projects",
            generation_mode="3",
            planned_primary_question_count=3,
            role="Backend Engineer",
            difficulty="intermediate"
        )
        res = generate_section_batch(req)
        self.assertEqual(len(res.questions), 3)

        # Question 1 had filler "Okay, thank you for sharing that." which must be stripped
        self.assertEqual(res.questions[0].text, "What trade-offs led you to choose Redis for caching?")
        self.assertEqual(res.questions[0].order, 1)
        self.assertEqual(res.questions[1].order, 2)
        self.assertEqual(res.questions[2].order, 3)

    @patch("app.services.interview.graph.LLMClient")
    def test_generate_section_batch_avoids_already_asked(self, mock_llm_client):
        """Verify that questions already asked are excluded from the new section batch."""
        mock_instance = MagicMock()
        mock_instance.get_llm.side_effect = Exception("offline")
        mock_llm_client.return_value = mock_instance

        already_asked = [
            "Can you walk me through the architecture and your specific personal contributions to a significant project you built as a Fullstack Engineer?"
        ]
        req = SectionBatchRequest(
            session_id="test_sess_no_repeat",
            section_id="projects",
            generation_mode="3",
            planned_primary_question_count=3,
            role="Fullstack Engineer",
            difficulty="intermediate",
            already_asked_questions=already_asked
        )
        res = generate_section_batch(req)
        texts = [q.text.lower() for q in res.questions]
        for asked in already_asked:
            self.assertNotIn(asked.lower(), texts)


if __name__ == "__main__":
    unittest.main()
