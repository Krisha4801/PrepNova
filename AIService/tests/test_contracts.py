import unittest
from app.schemas.interview import (
    QuestionCountMode,
    BlueprintSection,
    InterviewBlueprint,
    PlanBlueprintRequest,
    SectionBatchQuestion,
    SectionBatchRequest,
    SectionBatchResponse,
    RuntimeFollowUp,
    FollowUpDecisionRequest,
    FollowUpDecisionResponse,
)

class TestInterviewContracts(unittest.TestCase):
    def test_question_count_mode_enum(self):
        self.assertEqual(QuestionCountMode.COUNT_3.value, "3")
        self.assertEqual(QuestionCountMode.COUNT_6.value, "6")
        self.assertEqual(QuestionCountMode.COUNT_10.value, "10")
        self.assertEqual(QuestionCountMode.DYNAMIC.value, "dynamic")

    def test_section_batch_question_schema(self):
        q = SectionBatchQuestion(
            question_id="q-101",
            section_id="technical-skills",
            order=1,
            type="primary",
            objective="Assess pagination",
            difficulty="intermediate",
            text="How would you design pagination?",
            context_references=["api_spec.pdf"],
            status="pending"
        )
        data = q.model_dump(by_alias=True)
        self.assertEqual(data["question_id"], "q-101")
        self.assertEqual(data["section_id"], "technical-skills")
        self.assertEqual(data["status"], "pending")

    def test_section_batch_response_validation(self):
        resp = SectionBatchResponse(
            section_id="technical-skills",
            generation_mode="dynamic",
            planned_primary_question_count=6,
            questions=[
                SectionBatchQuestion(
                    question_id="q-1",
                    section_id="technical-skills",
                    order=1,
                    text="First question",
                    objective="Assess fundamentals"
                )
            ]
        )
        self.assertEqual(resp.sectionId, "technical-skills")
        self.assertEqual(len(resp.questions), 1)
        self.assertEqual(resp.generationVersion, 1)

    def test_runtime_follow_up_schema(self):
        fu = RuntimeFollowUp(
            parent_question_id="q-1",
            section_id="technical-skills",
            objective="Probe concurrency reasoning",
            text="How does that handle concurrent writes?",
            context_references=[]
        )
        self.assertEqual(fu.type, "follow_up")
        self.assertEqual(fu.parentQuestionId, "q-1")

    def test_follow_up_decision_contract(self):
        req = FollowUpDecisionRequest(
            session_id="sess_123",
            section_id="technical-skills",
            current_question_id="q-1",
            current_question_text="How do you cache?",
            submitted_answer="I use Redis for distributed caching.",
            role="Backend Engineer",
            difficulty="intermediate"
        )
        self.assertFalse(req.isSkipped)
        
        resp = FollowUpDecisionResponse(
            action="FOLLOW_UP",
            follow_up=RuntimeFollowUp(
                parent_question_id="q-1",
                section_id="technical-skills",
                text="What eviction policy did you configure?",
                context_references=[]
            )
        )
        self.assertEqual(resp.action, "FOLLOW_UP")
        self.assertIsNotNone(resp.followUp)

    def test_blueprint_section_planned_counts(self):
        sec = BlueprintSection(
            id="skills",
            type="skills",
            title="Core Skills",
            objective="Assess skills",
            planned_primary_question_count=6,
            competencies=["React", "TypeScript"],
            difficulty_distribution={"intermediate": 4, "advanced": 2}
        )
        self.assertEqual(sec.planned_primary_question_count, 6)
        self.assertIn("React", sec.competencies)

if __name__ == "__main__":
    unittest.main()
