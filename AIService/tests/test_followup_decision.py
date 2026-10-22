import unittest
from unittest.mock import patch, MagicMock
from app.schemas.interview import FollowUpDecisionRequest, FollowUpDecisionResponse
from app.services.interview.graph import decide_runtime_follow_up, is_non_answer


class TestFollowUpDecision(unittest.TestCase):
    def test_non_answer_detection(self):
        self.assertTrue(is_non_answer("idk"))
        self.assertTrue(is_non_answer("I don't know"))
        self.assertTrue(is_non_answer("pass"))
        self.assertTrue(is_non_answer("no idea"))
        self.assertTrue(is_non_answer("i am not sure"))
        self.assertTrue(is_non_answer("skip"))
        self.assertFalse(is_non_answer("I built a distributed cache using Redis and implemented cache invalidation."))

    def test_skipped_question_never_generates_follow_up(self):
        req = FollowUpDecisionRequest(
            session_id="sess_123",
            section_id="technical_concepts",
            current_question_id="q_1",
            current_question_text="How does database indexing work?",
            submitted_answer="[Skipped by candidate]",
            is_skipped=True,
            remaining_section_questions=3
        )
        res = decide_runtime_follow_up(req)
        self.assertIsInstance(res, FollowUpDecisionResponse)
        self.assertEqual(res.action, "NEXT_PRIMARY")
        self.assertIsNone(res.followUp)

    def test_explicit_idk_never_generates_follow_up(self):
        req = FollowUpDecisionRequest(
            session_id="sess_123",
            section_id="technical_concepts",
            current_question_id="q_1",
            current_question_text="How does indexing work?",
            submitted_answer="I don't know",
            is_skipped=False,
            remaining_section_questions=0
        )
        res = decide_runtime_follow_up(req)
        self.assertEqual(res.action, "NEXT_SECTION")
        self.assertIsNone(res.followUp)

    def test_introduction_section_never_generates_follow_up(self):
        req = FollowUpDecisionRequest(
            session_id="sess_123",
            section_id="introduction",
            current_question_id="q_intro",
            current_question_text="Introduce yourself.",
            submitted_answer="I am a software engineer with 5 years experience in Python and microservices.",
            is_skipped=False
        )
        res = decide_runtime_follow_up(req)
        self.assertEqual(res.action, "NEXT_SECTION")
        self.assertIsNone(res.followUp)

    def test_followup_limit_enforced(self):
        req = FollowUpDecisionRequest(
            session_id="sess_123",
            section_id="technical_concepts",
            current_question_id="q_1",
            current_question_text="Explain Redis caching.",
            submitted_answer="We used Redis as a write-through cache to reduce p99 query latency by 45%.",
            follow_ups_in_section=1,
            max_follow_ups_per_question=1,
            remaining_section_questions=2
        )
        res = decide_runtime_follow_up(req)
        self.assertEqual(res.action, "NEXT_PRIMARY")
        self.assertIsNone(res.followUp)

    @patch("app.services.interview.graph.LLMClient")
    def test_substantive_answer_generates_targeted_followup_no_filler(self, mock_llm_client_cls):
        mock_llm_inst = MagicMock()
        mock_llm_client_cls.return_value.get_llm.return_value = mock_llm_inst
        mock_llm_inst.invoke.return_value = MagicMock(content="""
        {
          "action": "FOLLOW_UP",
          "follow_up_text": "Okay, thank you for sharing that. What cache eviction policy did you choose for Redis?",
          "objective": "Probe cache eviction strategy under memory pressure",
          "reason": "Specific technical choice warranted deeper inquiry"
        }
        """)

        req = FollowUpDecisionRequest(
            session_id="sess_123",
            section_id="technical_concepts",
            current_question_id="q_tech_1",
            current_question_text="How did you optimize database performance?",
            submitted_answer="We introduced a Redis caching tier in front of Postgres to absorb spikes in read traffic.",
            follow_ups_in_section=0,
            max_follow_ups_per_question=1,
            remaining_section_questions=3
        )

        res = decide_runtime_follow_up(req)
        self.assertEqual(res.action, "FOLLOW_UP")
        self.assertIsNotNone(res.followUp)
        self.assertEqual(res.followUp.parentQuestionId, "q_tech_1")
        # Check that conversational filler is completely stripped
        self.assertFalse(res.followUp.text.startswith("Okay"))
        self.assertFalse(res.followUp.text.startswith("thank you"))
        self.assertIn("What cache eviction policy", res.followUp.text)


if __name__ == "__main__":
    unittest.main()
