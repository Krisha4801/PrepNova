import unittest
from app.services.interview.graph import (
    clean_conversational_filler,
    is_semantic_duplicate_question,
    generate_section_batch
)
from app.schemas.interview import SectionBatchRequest


class TestFillerAndDuplicatePrevention(unittest.TestCase):
    def test_clean_conversational_filler(self):
        cases = [
            (
                "Okay, thank you for sharing that. How would you design pagination for an API?",
                "How would you design pagination for an API?"
            ),
            (
                "Great, that's interesting! What caching strategy did you choose for Redis?",
                "What caching strategy did you choose for Redis?"
            ),
            (
                "Understood, that makes sense. Can you explain the difference between processes and threads?",
                "Can you explain the difference between processes and threads?"
            ),
            (
                "Based on what you just said, how do you handle race conditions?",
                "How do you handle race conditions?"
            ),
            (
                "As you mentioned earlier, why did you decide to use Kafka?",
                "Why did you decide to use Kafka?"
            ),
            (
                "Thanks for your answer. What is the time complexity of lookup in a hash map?",
                "What is the time complexity of lookup in a hash map?"
            ),
            (
                "Okay. How does database indexing work?",
                "How does database indexing work?"
            )
        ]
        for raw, expected in cases:
            cleaned = clean_conversational_filler(raw)
            self.assertEqual(cleaned, expected, f"Failed cleaning for: {raw}")

    def test_semantic_duplicate_detection(self):
        existing = [
            "How would you design pagination for an API returning millions of records?",
            "Can you explain how async/await works in Node.js event loop?"
        ]

        # Exact match
        self.assertTrue(is_semantic_duplicate_question(
            "How would you design pagination for an API returning millions of records?",
            existing
        ))

        # Minor rewording / near-duplicate (> 85% token overlap)
        self.assertTrue(is_semantic_duplicate_question(
            "How would you design pagination for an API returning millions of records to clients?",
            existing
        ))

        # Distinct question in same domain
        self.assertFalse(is_semantic_duplicate_question(
            "What cache invalidation strategy do you use when updating records?",
            existing
        ))

    def test_batch_generation_enforces_semantic_dedup_and_filler_free(self):
        req = SectionBatchRequest(
            session_id="sess_dedup_test",
            section_id="technical_concepts",
            generation_mode="3",
            planned_primary_question_count=3,
            role="Backend Engineer",
            difficulty="intermediate",
            already_asked_questions=[
                "How would you optimize slow database queries in PostgreSQL?"
            ]
        )
        res = generate_section_batch(req)
        self.assertEqual(len(res.questions), 3)

        # Check all questions are filler-free
        for q in res.questions:
            self.assertFalse(q.text.lower().startswith("okay"))
            self.assertFalse(q.text.lower().startswith("thank you"))
            self.assertFalse(q.text.lower().startswith("great"))
            self.assertFalse(q.text.lower().startswith("based on what you"))

        # Check no duplicates within batch
        texts = [q.text for q in res.questions]
        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                self.assertFalse(
                    is_semantic_duplicate_question(texts[i], [texts[j]]),
                    f"Batch contains duplicate questions: '{texts[i]}' vs '{texts[j]}'"
                )


if __name__ == "__main__":
    unittest.main()
