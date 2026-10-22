import unittest
from app.schemas.interview import (
    PlanBlueprintRequest,
    DifficultyLevel,
    QuestionCountMode
)
from app.services.interview.graph import plan_interview_blueprint

class TestQuestionCountModes(unittest.TestCase):
    def test_mode_3_per_section(self):
        req = PlanBlueprintRequest(
            role="Backend Developer",
            difficulty=DifficultyLevel.INTERMEDIATE,
            question_count_mode="3"
        )
        bp = plan_interview_blueprint(req)
        self.assertEqual(bp.question_count_mode, "3")
        intro = [s for s in bp.sections if s.id == "introduction"][0]
        self.assertEqual(intro.planned_primary_question_count, 1)
        for s in bp.sections:
            if s.id != "introduction" and s.applicable:
                self.assertEqual(
                    s.planned_primary_question_count, 3,
                    f"Section {s.id} expected 3 questions, got {s.planned_primary_question_count}"
                )
        self.assertGreater(bp.total_planned_primary_questions, 6, "Total questions across sections must exceed 6")

    def test_mode_6_per_section(self):
        req = PlanBlueprintRequest(
            role="Frontend Developer",
            difficulty=DifficultyLevel.BEGINNER,
            question_count_mode="6"
        )
        bp = plan_interview_blueprint(req)
        self.assertEqual(bp.question_count_mode, "6")
        for s in bp.sections:
            if s.id != "introduction" and s.applicable:
                self.assertEqual(s.planned_primary_question_count, 6)

    def test_mode_10_per_section(self):
        req = PlanBlueprintRequest(
            role="DevOps Engineer",
            difficulty=DifficultyLevel.ADVANCED,
            question_count_mode="10"
        )
        bp = plan_interview_blueprint(req)
        self.assertEqual(bp.question_count_mode, "10")
        for s in bp.sections:
            if s.id != "introduction" and s.applicable:
                self.assertEqual(s.planned_primary_question_count, 10)

    def test_numeric_fallback_per_section(self):
        # Backward compatibility if max_questions=3 is passed
        req = PlanBlueprintRequest(
            role="Software Engineer",
            max_questions=3
        )
        bp = plan_interview_blueprint(req)
        self.assertEqual(bp.question_count_mode, "3")
        projects = [s for s in bp.sections if s.id == "projects"][0]
        self.assertEqual(projects.planned_primary_question_count, 3)

if __name__ == "__main__":
    unittest.main()
