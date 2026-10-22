import unittest
from app.schemas.interview import (
    PlanBlueprintRequest,
    DifficultyLevel,
    InterviewMode
)
from app.services.interview.graph import (
    plan_interview_blueprint,
    calculate_dynamic_section_counts
)


class TestDynamicSectionCounts(unittest.TestCase):
    def test_dynamic_counts_differ_by_section(self):
        """Verify that dynamic mode produces differential question counts across sections."""
        req = PlanBlueprintRequest(
            role="Staff Distributed Systems Architect",
            difficulty=DifficultyLevel.ADVANCED,
            target_duration_minutes=45,
            question_count_mode="dynamic",
            focus_areas=["Distributed Systems", "Kubernetes", "Fault Tolerance"]
        )
        bp = plan_interview_blueprint(req)
        self.assertEqual(bp.question_count_mode, "dynamic")

        counts = {s.id: s.planned_primary_question_count for s in bp.sections if s.applicable}
        self.assertIn("introduction", counts)
        self.assertEqual(counts["introduction"], 1)

        # Different sections should receive different counts based on weights
        unique_counts = set(counts.values())
        self.assertGreater(len(unique_counts), 1, "Dynamic mode must produce varying counts per section")

        # In senior architect role, scenario should have higher or equal count compared to behavioral
        self.assertGreaterEqual(counts.get("scenario", 0), counts.get("behavioral", 0))

    def test_dynamic_counts_scale_with_duration(self):
        """Verify that dynamic counts scale proportionally with session duration."""
        req_15 = PlanBlueprintRequest(
            role="Backend Engineer",
            difficulty=DifficultyLevel.INTERMEDIATE,
            target_duration_minutes=15,
            question_count_mode="dynamic"
        )
        req_30 = PlanBlueprintRequest(
            role="Backend Engineer",
            difficulty=DifficultyLevel.INTERMEDIATE,
            target_duration_minutes=30,
            question_count_mode="dynamic"
        )
        req_60 = PlanBlueprintRequest(
            role="Backend Engineer",
            difficulty=DifficultyLevel.INTERMEDIATE,
            target_duration_minutes=60,
            question_count_mode="dynamic"
        )

        bp_15 = plan_interview_blueprint(req_15)
        bp_30 = plan_interview_blueprint(req_30)
        bp_60 = plan_interview_blueprint(req_60)

        self.assertLess(bp_15.total_planned_primary_questions, bp_30.total_planned_primary_questions)
        self.assertLess(bp_30.total_planned_primary_questions, bp_60.total_planned_primary_questions)

        # For 15 mins, each section should have a modest count (1-2)
        for s in bp_15.sections:
            if s.applicable and s.id != "introduction":
                self.assertLessEqual(s.planned_primary_question_count, 3)

    def test_dynamic_counts_strict_bounds_enforced(self):
        """Verify that dynamic counts never exceed upper bound (10) or lower bound (1)."""
        # Extreme long duration: 240 minutes
        req_extreme = PlanBlueprintRequest(
            role="Principal Security Architect",
            difficulty=DifficultyLevel.ADVANCED,
            target_duration_minutes=240,
            question_count_mode="dynamic"
        )
        bp_extreme = plan_interview_blueprint(req_extreme)
        for s in bp_extreme.sections:
            if s.applicable:
                self.assertLessEqual(
                    s.planned_primary_question_count, 10,
                    f"Section {s.id} exceeded upper bound 10 with count {s.planned_primary_question_count}"
                )

        # Minimal duration: 10 minutes
        req_min = PlanBlueprintRequest(
            role="Junior Web Developer",
            difficulty=DifficultyLevel.BEGINNER,
            target_duration_minutes=10,
            question_count_mode="dynamic"
        )
        bp_min = plan_interview_blueprint(req_min)
        for s in bp_min.sections:
            if s.applicable:
                self.assertGreaterEqual(
                    s.planned_primary_question_count, 1,
                    f"Applicable section {s.id} had count < 1"
                )

    def test_dynamic_counts_senior_vs_junior_distribution(self):
        """Verify that junior roles prioritize projects while senior roles prioritize scenarios/architecture."""
        section_ids = ["introduction", "projects", "skills", "technical_concepts", "scenario", "behavioral"]

        req_junior = PlanBlueprintRequest(
            role="Software Engineer Intern",
            difficulty=DifficultyLevel.BEGINNER,
            target_duration_minutes=35,
            question_count_mode="dynamic"
        )
        counts_junior = calculate_dynamic_section_counts(
            request=req_junior,
            section_ids=section_ids,
            has_resume=True,
            has_jd=False,
            resume_evidence={"has_projects": True, "chunk_count": 5}
        )

        req_senior = PlanBlueprintRequest(
            role="Staff Cloud Infrastructure Architect",
            difficulty=DifficultyLevel.ADVANCED,
            target_duration_minutes=35,
            question_count_mode="dynamic"
        )
        counts_senior = calculate_dynamic_section_counts(
            request=req_senior,
            section_ids=section_ids,
            has_resume=True,
            has_jd=True,
            jd_evidence={"has_requirements": True, "has_system_design": True}
        )

        # Junior project questions should be higher than scenario questions
        self.assertGreater(counts_junior["projects"], counts_junior["scenario"])

        # Senior scenario questions should be higher than junior scenario questions
        self.assertGreater(counts_senior["scenario"], counts_junior["scenario"])

    def test_dynamic_counts_missing_context_fallback(self):
        """Verify that sparse or missing resume/JD falls back cleanly to role-based counts."""
        req = PlanBlueprintRequest(
            role="General Software Developer",
            difficulty=DifficultyLevel.BEGINNER,
            target_duration_minutes=30,
            question_count_mode="dynamic",
            resume_id=None,
            jd_id=None
        )
        bp = plan_interview_blueprint(req)
        self.assertEqual(bp.question_count_mode, "dynamic")
        self.assertGreater(bp.total_planned_primary_questions, 0)

        # Verify projects section has fallback skip_reason
        projects_sec = next((s for s in bp.sections if s.id == "projects"), None)
        self.assertIsNotNone(projects_sec)
        self.assertIsNotNone(projects_sec.skip_reason)
        self.assertIn("no resume", projects_sec.skip_reason.lower())


if __name__ == "__main__":
    unittest.main()
