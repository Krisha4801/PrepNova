const InterviewSession = require("../models/InterviewSession");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const { aiServiceClient } = require("../services/aiService.client");
const {
  LEVELS,
  evaluateAnswer: fallbackEvaluateAnswer,
  generateQuestion: fallbackGenerateQuestion,
  getAvailableRoles,
  normalizeLevel
} = require("../services/llm.service");

const MAX_QUESTIONS = 6;
// In-memory active session cache layered over MongoDB for resilience and fast retrieval
const activeSessionCache = new Map();

function createSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ratingLabel(score) {
  if (score >= 8.5) return "Excellent";
  if (score >= 7.0) return "Interview ready";
  if (score >= 5.0) return "Needs targeted practice";
  return "Needs fundamentals";
}

function nextDifficulty(currentLevel, rating) {
  const normalized = (currentLevel || "beginner").toLowerCase();
  const currentIndex = LEVELS.indexOf(normalized);

  if (currentIndex === -1) {
    return "beginner";
  }

  if (rating >= 8.0 && currentIndex < LEVELS.length - 1) {
    return LEVELS[currentIndex + 1];
  }

  if (rating <= 4.5 && currentIndex > 0) {
    return LEVELS[currentIndex - 1];
  }

  return normalized;
}

function averageScore(evaluations, field) {
  if (!evaluations || !evaluations.length) return 0;
  const total = evaluations.reduce((sum, item) => sum + Number(item[field] || 0), 0);
  return Math.round((total / evaluations.length) * 10) / 10;
}

function uniquePush(items, value) {
  if (value && !items.includes(value)) {
    items.push(value);
  }
}

function buildFinalFeedback(evaluations) {
  const finalScore = averageScore(evaluations, "score") || averageScore(evaluations, "rating");
  const correctness = averageScore(evaluations, "correctness");
  const clarity = averageScore(evaluations, "clarity");
  const depth = averageScore(evaluations, "depth");
  const relevance = averageScore(evaluations, "relevance") || finalScore;
  const completeness = averageScore(evaluations, "completeness") || finalScore;

  const categoryScores = {
    correctness: correctness || finalScore,
    clarity: clarity || finalScore,
    depth: depth || finalScore,
    relevance: relevance || finalScore,
    completeness: completeness || finalScore
  };

  const areas = [];
  const strengths = [];

  evaluations.forEach((item) => {
    (item.strengths || []).forEach((s) => uniquePush(strengths, s));
    (item.areasOfImprovement || item.areas_of_improvement || []).forEach((a) => uniquePush(areas, a));
  });

  if (correctness < 7.0) {
    areas.unshift("Strengthen technical accuracy by clearly defining core constraints and terminology.");
  }
  if (depth < 7.0) {
    areas.unshift("Provide deeper explanations, architectural trade-offs, and edge cases.");
  }
  if (clarity < 7.0) {
    areas.unshift("Structure your answers with the Definition -> Mechanism -> Trade-off pattern.");
  }

  return {
    finalScore: roundScore(finalScore),
    rating: ratingLabel(finalScore),
    categoryScores,
    feedback: `${ratingLabel(finalScore)}: ${finalScore}/10 across ${evaluations.length} questions.`,
    strengths: strengths.slice(0, 5),
    areasOfImprovement: areas.slice(0, 5),
    completedAt: new Date()
  };
}

function roundScore(val) {
  return Math.round(Number(val || 0) * 10) / 10;
}

function buildSkippedEvaluation(questionRecord, questionIndex = 0) {
  return {
    questionIndex: typeof questionIndex === "number" ? questionIndex : 0,
    score: 0,
    relevance: 0,
    correctness: 0,
    completeness: 0,
    clarity: 0,
    depth: 0,
    ratingLabel: "Question skipped",
    feedback: "Question skipped by candidate.",
    strengths: [],
    areasOfImprovement: [
      "Review the reference solution and practice answering concisely with a concrete example."
    ],
    matchedConcepts: [],
    missedConcepts: questionRecord?.expectedConcepts || [],
    referenceAnswer: questionRecord?.expectedAnswer || "A complete response explains the concept, trade-offs, and practical application.",
    nextDifficulty: questionRecord?.difficulty || "beginner",
    source: "skipped"
  };
}


/**
 * START INTERVIEW
 * Enforces input combination rules, initializes persistent session in MongoDB.
 * POST /api/interview/start
 */
exports.startInterview = async (req, res, next) => {
  try {
    const { name, role, level, resumeId, jdId, focusAreas } = req.body;
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required to start an interview." });
    }

    let selectedRole = String(role || "").trim();
    let effectiveResumeId = resumeId;

    // Auto-reuse user's stored active resume from MongoDB if not explicitly passed and not in an explicit non-resume mode
    const nonResumeExplicitModes = ["role", "jd", "role_jd"];
    if (!effectiveResumeId && (!req.body.mode || !nonResumeExplicitModes.includes(req.body.mode))) {
      try {
        const latestResume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
        if (latestResume) {
          effectiveResumeId = latestResume.documentId;
        }
      } catch (e) { /* ignore */ }
    }

    // 1. Smart Role Resolution Cascade (if user did not specify a role)
    if (!selectedRole && jdId) {
      try {
        const jdDoc = await JobDescription.findOne({ documentId: jdId, userId });
        if (jdDoc) {
          selectedRole = jdDoc.parsedData?.role_title || jdDoc.parsedData?.title || jdDoc.title || "";
        }
      } catch (e) { /* ignore */ }
    }
    if (!selectedRole && effectiveResumeId) {
      try {
        const resumeDoc = await Resume.findOne({ documentId: effectiveResumeId, userId });
        if (resumeDoc) {
          selectedRole = resumeDoc.detectedRole || resumeDoc.parsedData?.candidate?.targetRole || "";
        }
      } catch (e) { /* ignore */ }
    }

    // 2. All 7 Context Combinations
    const validModes = ["resume_jd_role", "resume_jd", "resume_role", "resume", "role_jd", "jd", "role"];
    let mode = req.body.mode && validModes.includes(req.body.mode) ? req.body.mode : null;

    if (!mode) {
      if (effectiveResumeId && jdId && selectedRole) {
        mode = "resume_jd_role";
      } else if (effectiveResumeId && jdId) {
        mode = "resume_jd";
      } else if (effectiveResumeId && selectedRole) {
        mode = "resume_role";
      } else if (effectiveResumeId) {
        mode = "resume";
      } else if (jdId && selectedRole) {
        mode = "role_jd";
      } else if (jdId) {
        mode = "jd";
      } else if (selectedRole) {
        mode = "role";
      } else {
        return res.status(400).json({
          error: "Insufficient context: Please provide a resume, job description, or target role to start your interview."
        });
      }
    }

    // Deterministic source isolation: zero out unpermitted sources for the active mode
    const resumePermittedModes = ["resume", "resume_jd", "resume_role", "resume_jd_role"];
    const jdPermittedModes = ["jd", "resume_jd", "role_jd", "resume_jd_role"];
    if (!resumePermittedModes.includes(mode)) {
      effectiveResumeId = null;
    }
    const effectiveJdId = jdPermittedModes.includes(mode) ? (jdId || null) : null;

    // Fetch JD title to pass into the AI service (used by hybrid role-JD conflict check)
    let jdTitle = "";
    if (effectiveJdId) {
      try {
        const jdDoc = await JobDescription.findOne({ documentId: effectiveJdId, userId });
        if (jdDoc) {
          jdTitle = jdDoc.parsedData?.role_title || jdDoc.parsedData?.title || jdDoc.title || jdDoc.parsedData?.job_info?.title || "";
        }
      } catch (jdFetchErr) {
        console.warn("JD title lookup warning:", jdFetchErr.message);
      }
    }

    // 3. For non-role modes (resume, jd, resume_jd), role is NOT required or forced
    const nonRoleModes = ["resume", "jd", "resume_jd"];
    if (nonRoleModes.includes(mode)) {
      if (!selectedRole || selectedRole.toLowerCase() === "software engineer") {
        selectedRole = mode === "resume" ? "Resume Candidate" : mode === "jd" ? "JD Candidate" : "Candidate";
      }
    } else {
      if (!selectedRole) {
        selectedRole = "Candidate";
      }
    }

    const selectedLevel = normalizeLevel(level) || "beginner";
    const sessionId = createSessionId();
    const durationMinutes = Math.round(Number(req.body.durationMinutes) || 30);
    const requestedMaxQuestions = req.body.maxQuestions || req.body.numberOfQuestions
      ? Math.max(1, Math.min(20, Number(req.body.maxQuestions || req.body.numberOfQuestions)))
      : null;

    // Call LangGraph AI engine to generate interview blueprint
    let blueprint = null;
    try {
      blueprint = await aiServiceClient.planBlueprint({
        userId,
        role: nonRoleModes.includes(mode) ? "" : selectedRole,
        difficulty: selectedLevel,
        mode,
        resumeId: effectiveResumeId,
        jdId: effectiveJdId,
        jdTitle: jdTitle || undefined,
        targetDurationMinutes: durationMinutes,
        maxQuestions: requestedMaxQuestions,
        focusAreas: Array.isArray(focusAreas) ? focusAreas : []
      });
    } catch (blueprintErr) {
      if (blueprintErr.statusCode === 400 || (blueprintErr.message && blueprintErr.message.toLowerCase().includes("does not match"))) {
        return res.status(400).json({ error: blueprintErr.message });
      }
      console.warn("Blueprint planning fallback:", blueprintErr.message);
    }

    // Spec Requirement (Section 3.2): First question is ALWAYS the opening self-introduction
    const introQuestionText = `Hello! To get started, could you please introduce yourself and highlight the key experiences, skills, and projects most relevant to this ${selectedRole} position?`;

    const firstQuestionItem = {
      questionId: `turn_0_${Date.now()}`,
      question: introQuestionText,
      category: "Introduction",
      format: "Open",
      difficulty: selectedLevel,
      groundingContext: null,
      expectedConcepts: [selectedRole],
      expectedAnswer: null,
      source: "conversational_engine",
      sectionId: "introduction",
      questionType: "primary",
      estimatedSeconds: 90
    };

    const totalQuestions = requestedMaxQuestions || (blueprint?.sections?.length ? blueprint.sections.length : MAX_QUESTIONS);

    if (blueprint && Array.isArray(blueprint.sections) && blueprint.sections.length > totalQuestions) {
      const intro = blueprint.sections.find(s => s.section_id === "introduction") || blueprint.sections[0];
      const others = blueprint.sections.filter(s => s !== intro);
      blueprint.sections = [intro, ...others.slice(0, Math.max(0, totalQuestions - 1))];
    }

    // Create durable session in MongoDB
    const sessionDoc = await InterviewSession.create({
      userId,
      sessionId,
      role: selectedRole,
      difficulty: selectedLevel,
      mode,
      resumeId: effectiveResumeId || null,
      jdId: jdId || null,
      status: "in_progress",
      reportStatus: "not_started",
      blueprint,
      totalQuestions,
      questionCount: 1,
      questions: [firstQuestionItem],
      answers: [],
      evaluations: []
    });

    activeSessionCache.set(sessionId, sessionDoc.toObject());

    res.status(200).json({
      sessionId,
      question: firstQuestionItem.question,
      section: firstQuestionItem.sectionId,
      questionType: firstQuestionItem.questionType,
      category: firstQuestionItem.category,
      format: firstQuestionItem.format,
      level: firstQuestionItem.difficulty,
      source: firstQuestionItem.source,
      matchedRole: selectedRole,
      mode,
      availableRoles: getAvailableRoles(),
      availableLevels: LEVELS,
      progress: {
        current: 1,
        total: totalQuestions
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * HELPER: Finalize and persist full session evaluation at interview conclusion
 */
async function finalizeSessionEvaluation(session, res) {
  try {
    session.status = "evaluating";
    session.reportStatus = "running";
    await session.save();

    const transcriptItems = session.questions.map((q, idx) => ({
      question_index: idx,
      section_id: q.sectionId || (idx === 0 ? "introduction" : "technical"),
      question: q.question,
      answer: session.answers[idx]?.answer || "",
      is_skipped: !!session.answers[idx]?.isSkipped,
      difficulty: q.difficulty || session.difficulty
    }));

    let batchResult = null;
    try {
      batchResult = await aiServiceClient.evaluateSession({
        role: session.role,
        difficulty: session.difficulty,
        transcript: transcriptItems,
        blueprint: session.blueprint,
        resumeId: session.resumeId,
        jdId: session.jdId
      });
    } catch (aiErr) {
      console.warn("AI session evaluation failed, using fallback aggregation:", aiErr.message);
    }

    let finalReport;
    if (batchResult) {
      const formattedEvaluations = (batchResult.evaluations || []).map((ev, idx) => {
        const qIdx = typeof ev.question_index === "number" ? ev.question_index : (typeof ev.questionIndex === "number" ? ev.questionIndex : idx);
        const scoreVal = roundScore(ev.score);
        return {
          questionIndex: qIdx,
          question_index: qIdx,
          sectionId: ev.section_id || ev.sectionId || null,
          section_id: ev.section_id || ev.sectionId || null,
          score: scoreVal,
          relevance: roundScore(ev.relevance !== undefined ? ev.relevance : scoreVal),
          correctness: roundScore(ev.correctness !== undefined ? ev.correctness : scoreVal),
          completeness: roundScore(ev.completeness !== undefined ? ev.completeness : scoreVal),
          clarity: roundScore(ev.clarity !== undefined ? ev.clarity : scoreVal),
          depth: roundScore(ev.depth !== undefined ? ev.depth : scoreVal),
          ratingLabel: ev.rating_label || ev.ratingLabel || ratingLabel(scoreVal),
          feedback: ev.feedback || "Answer evaluated.",
          strengths: Array.isArray(ev.strengths) ? ev.strengths : [],
          areasOfImprovement: Array.isArray(ev.areas_of_improvement || ev.areasOfImprovement) ? (ev.areas_of_improvement || ev.areasOfImprovement) : [],
          matchedConcepts: Array.isArray(ev.matched_concepts || ev.matchedConcepts) ? (ev.matched_concepts || ev.matchedConcepts) : [],
          missedConcepts: Array.isArray(ev.missed_concepts || ev.missedConcepts) ? (ev.missed_concepts || ev.missedConcepts) : []
        };
      });

      finalReport = {
        finalScore: roundScore(batchResult.overall_score),
        rating: batchResult.rating_label || ratingLabel(batchResult.overall_score),
        categoryScores: batchResult.category_scores || {
          correctness: 7.5,
          clarity: 7.5,
          depth: 7.0,
          relevance: 8.0,
          completeness: 7.5
        },
        introEvaluation: batchResult.intro_evaluation || null,
        sectionSummaries: batchResult.section_summaries || {},
        strengths: batchResult.strengths || [],
        areasOfImprovement: batchResult.areas_of_improvement || [],
        preparationPlan: batchResult.preparation_plan || [],
        coverageSummary: batchResult.coverage_summary || {},
        evaluations: formattedEvaluations,
        feedback: batchResult.feedback || `Completed interview evaluation for ${session.role}.`,
        completedAt: new Date()
      };

      session.evaluations = formattedEvaluations;
    } else {
      const answeredTurns = session.answers.filter(
        (a) => a && !a.isSkipped && String(a.answer || "").trim() && !String(a.answer).toLowerCase().includes("skipped")
      );
      const isUnansweredSession = answeredTurns.length === 0;

      const fallbackEvals = session.questions.map((q, idx) => {
        const ansObj = session.answers[idx];
        const hasSubstantiveAnswer = ansObj && !ansObj.isSkipped && String(ansObj.answer || "").trim() && !String(ansObj.answer).toLowerCase().includes("skipped");
        const qScore = hasSubstantiveAnswer ? 6.5 : 0.0;
        return {
          questionIndex: idx,
          question_index: idx,
          sectionId: q.sectionId || (idx === 0 ? "introduction" : "technical"),
          section_id: q.sectionId || (idx === 0 ? "introduction" : "technical"),
          score: qScore,
          relevance: hasSubstantiveAnswer ? 7.0 : 0.0,
          correctness: hasSubstantiveAnswer ? 6.5 : 0.0,
          completeness: hasSubstantiveAnswer ? 6.5 : 0.0,
          clarity: hasSubstantiveAnswer ? 7.0 : 0.0,
          depth: hasSubstantiveAnswer ? 6.0 : 0.0,
          ratingLabel: hasSubstantiveAnswer ? ratingLabel(qScore) : "Unanswered",
          feedback: hasSubstantiveAnswer ? "Answer recorded." : "Question skipped or unanswered by candidate.",
          strengths: hasSubstantiveAnswer ? ["Attempted response"] : [],
          areasOfImprovement: hasSubstantiveAnswer ? ["Provide deeper architectural trade-offs"] : ["Attempt question with concrete technical details"]
        };
      });

      if (isUnansweredSession) {
        finalReport = {
          finalScore: 0.0,
          rating: "Needs fundamentals",
          categoryScores: {
            correctness: 0.0,
            clarity: 0.0,
            depth: 0.0,
            relevance: 0.0,
            completeness: 0.0
          },
          introEvaluation: null,
          sectionSummaries: {},
          strengths: [],
          areasOfImprovement: ["All questions were skipped or left unanswered. Practice attempting each question with concrete examples."],
          preparationPlan: [
            `Review core fundamentals for ${session.role}`,
            "Practice speaking and typing responses to standard interview questions",
            "Attempt mock sessions and complete all questions without skipping"
          ],
          coverageSummary: {},
          evaluations: fallbackEvals,
          feedback: "Candidate did not provide substantive responses to interview questions. Assessment marked as incomplete.",
          completedAt: new Date()
        };
      } else {
        finalReport = buildFinalFeedback(fallbackEvals);
        finalReport.evaluations = fallbackEvals;
        finalReport.preparationPlan = [
          `Review core architectural concepts for ${session.role}`,
          "Practice communicating technical trade-offs using concrete metrics"
        ];
      }
      session.evaluations = fallbackEvals;
    }

    session.status = "completed";
    session.reportStatus = "completed";
    session.finalReport = finalReport;

    await session.save();
    activeSessionCache.delete(session.sessionId);

    return res.json({
      completed: true,
      sessionId: session.sessionId,
      status: "completed",
      reportStatus: "completed",
      finalReport,
      report: finalReport,
      ...finalReport
    });
  } catch (err) {
    console.error("finalizeSessionEvaluation error:", err);
    session.status = "evaluation_failed";
    session.reportStatus = "failed";
    await session.save().catch(() => null);
    return res.status(500).json({
      completed: true,
      sessionId: session.sessionId,
      status: "evaluation_failed",
      reportStatus: "failed",
      error: "Report evaluation encountered an error. Your transcript is safely stored and you can retry report generation."
    });
  }
}

/**
 * SUBMIT ANSWER & ADVANCE INTERVIEW
 * Strictly persists answer without live scoring (evaluationStatus: "pending")
 * Delivers next question according to blueprint and bounded follow-up policy.
 * POST /api/interview/followup
 */
exports.followup = async (req, res, next) => {
  try {
    const { sessionId, answer, audioUsed } = req.body;
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }

    if (!String(answer || "").trim()) {
      return res.status(400).json({ error: "Answer text is required." });
    }

    // Load durable session from DB
    let session = await InterviewSession.findOne({ sessionId });
    if (!session) {
      return res.status(400).json({ error: "Invalid or expired interview session." });
    }

    if (String(session.userId) !== userId) {
      return res.status(403).json({ error: "Access denied. You do not own this interview session." });
    }

    if (session.status === "completed") {
      return res.status(400).json({ error: "This interview session is already completed." });
    }

    // If turn budget already exhausted or reached, update last answer if needed and finalize
    if (session.answers.length >= session.totalQuestions) {
      if (session.answers.length > 0 && String(answer || "").trim()) {
        const lastAns = session.answers[session.answers.length - 1];
        if (!lastAns.answer || lastAns.answer === "[Skipped by candidate]") {
          lastAns.answer = String(answer).trim();
          await session.save().catch(() => null);
        }
      }
      return await finalizeSessionEvaluation(session, res);
    }

    const currentIndex = session.answers.length;
    const currentQuestion = session.questions[currentIndex] || session.questions[session.questions.length - 1];

    // Idempotency: avoid duplicate appends on retry
    const existingAnswer = session.answers.find((a) => a.questionIndex === currentIndex);
    if (!existingAnswer) {
      session.answers.push({
        questionIndex: currentIndex,
        turnId: currentQuestion.questionId || `turn_${currentIndex}`,
        sectionId: currentQuestion.sectionId || "introduction",
        answer: String(answer).trim(),
        isSkipped: false,
        audioUsed: !!audioUsed,
        evaluationStatus: "pending",
        submittedAt: new Date()
      });
      await session.save();
    }

    // Check if turn budget exhausted
    if (session.answers.length >= session.totalQuestions) {
      return await finalizeSessionEvaluation(session, res);
    }

    // Generate next turn via Conversational Turn Engine
    let nextTurn = null;
    try {
      const historyItems = session.questions.map((q, idx) => ({
        questionId: q.questionId,
        question: q.question,
        section_id: q.sectionId,
        question_type: q.questionType,
        answer: session.answers[idx]?.answer || "",
        is_skipped: !!session.answers[idx]?.isSkipped
      }));

      const sectionTurns = session.questions.filter((q) => q.sectionId === currentQuestion.sectionId && q.questionType === "follow_up").length;

      nextTurn = await aiServiceClient.generateNextTurn({
        sessionId,
        userId,
        role: session.role,
        difficulty: session.difficulty,
        mode: session.mode,
        resumeId: session.resumeId,
        jdId: session.jdId,
        blueprint: session.blueprint,
        history: historyItems,
        currentSectionId: currentQuestion.sectionId,
        followUpsInCurrentSection: sectionTurns,
        totalTurnsTaken: session.answers.length,
        maxTurns: session.totalQuestions
      });
    } catch (turnErr) {
      console.warn("generateNextTurn fallback:", turnErr.message);
    }

    if (!nextTurn || nextTurn.action === "COMPLETE" || nextTurn.is_complete) {
      return await finalizeSessionEvaluation(session, res);
    }

    const nextQuestionItem = {
      questionId: `turn_${session.questions.length + 1}_${Date.now()}`,
      question: nextTurn.interviewer_text,
      category: nextTurn.section_id || "Technical Concept",
      format: "Conversational",
      difficulty: session.difficulty,
      sectionId: nextTurn.section_id || "technical",
      questionType: nextTurn.question_type || "primary",
      parentQuestionId: nextTurn.parent_question_id || null,
      reasonCode: nextTurn.reason_code || null,
      expectedEvidence: nextTurn.expected_evidence || [],
      estimatedSeconds: nextTurn.estimated_seconds || 60,
      source: "conversational_engine"
    };

    session.questions.push(nextQuestionItem);
    session.questionCount = session.questions.length;
    await session.save();
    activeSessionCache.set(sessionId, session.toObject());

    // Never return scores or evaluation during live turns
    return res.json({
      completed: false,
      question: nextQuestionItem.question,
      nextQuestion: nextQuestionItem.question,
      section: nextQuestionItem.sectionId,
      questionType: nextQuestionItem.questionType,
      category: nextQuestionItem.category,
      format: nextQuestionItem.format,
      level: nextQuestionItem.difficulty,
      source: nextQuestionItem.source,
      progress: {
        current: session.questions.length,
        total: session.totalQuestions
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SKIP QUESTION
 * POST /api/interview/skip
 */
exports.skipQuestion = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }

    const session = await InterviewSession.findOne({ sessionId });
    if (!session) {
      return res.status(400).json({ error: "Invalid session." });
    }

    if (String(session.userId) !== userId) {
      return res.status(403).json({ error: "Access denied. You do not own this interview session." });
    }

    const currentIndex = session.answers.length;
    const currentQuestion = session.questions[currentIndex] || session.questions[session.questions.length - 1];

    session.answers.push({
      questionIndex: currentIndex,
      turnId: currentQuestion.questionId || `turn_${currentIndex}`,
      sectionId: currentQuestion.sectionId || "introduction",
      answer: "[Skipped by candidate]",
      isSkipped: true,
      audioUsed: false,
      evaluationStatus: "skipped",
      submittedAt: new Date()
    });
    await session.save();

    if (session.answers.length >= session.totalQuestions) {
      return await finalizeSessionEvaluation(session, res);
    }

    let nextTurn = null;
    try {
      const historyItems = session.questions.map((q, idx) => ({
        questionId: q.questionId,
        question: q.question,
        section_id: q.sectionId,
        question_type: q.questionType,
        answer: session.answers[idx]?.answer || "",
        is_skipped: !!session.answers[idx]?.isSkipped
      }));

      nextTurn = await aiServiceClient.generateNextTurn({
        sessionId,
        userId,
        role: session.role,
        difficulty: session.difficulty,
        mode: session.mode,
        resumeId: session.resumeId,
        jdId: session.jdId,
        blueprint: session.blueprint,
        history: historyItems,
        currentSectionId: currentQuestion.sectionId,
        followUpsInCurrentSection: 1, // Skip bypasses follow-ups
        totalTurnsTaken: session.answers.length,
        maxTurns: session.totalQuestions
      });
    } catch (skipErr) {
      console.warn("generateNextTurn on skip fallback:", skipErr.message);
    }

    if (!nextTurn || nextTurn.action === "COMPLETE" || nextTurn.is_complete) {
      return await finalizeSessionEvaluation(session, res);
    }

    const nextQuestionItem = {
      questionId: `turn_${session.questions.length + 1}_${Date.now()}`,
      question: nextTurn.interviewer_text,
      category: nextTurn.section_id || "Technical Concept",
      format: "Conversational",
      difficulty: session.difficulty,
      sectionId: nextTurn.section_id || "technical",
      questionType: nextTurn.question_type || "primary",
      parentQuestionId: null,
      source: "conversational_engine"
    };

    session.questions.push(nextQuestionItem);
    session.questionCount = session.questions.length;
    await session.save();

    return res.json({
      skipped: true,
      completed: false,
      question: nextQuestionItem.question,
      nextQuestion: nextQuestionItem.question,
      section: nextQuestionItem.sectionId,
      questionType: nextQuestionItem.questionType,
      level: nextQuestionItem.difficulty,
      progress: {
        current: session.questions.length,
        total: session.totalQuestions
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * FINISH / END INTERVIEW
 * POST /api/interview/end or DELETE /api/interview/:sessionId
 */
exports.endInterview = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId || req.body.sessionId;
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }

    const session = await InterviewSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (String(session.userId) !== userId) {
      return res.status(403).json({ error: "Access denied. You do not own this session." });
    }

    if (session.status === "completed" && session.finalReport) {
      return res.json({
        ended: true,
        completed: true,
        sessionId,
        status: "completed",
        finalReport: session.finalReport,
        report: session.finalReport
      });
    }

    return await finalizeSessionEvaluation(session, res);
  } catch (err) {
    next(err);
  }
};

/**
 * RETRY REPORT EVALUATION
 * POST /api/interview/:sessionId/retry-report
 */
exports.retryReport = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    const session = await InterviewSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Interview session not found." });
    }

    if (String(session.userId) !== userId) {
      return res.status(403).json({ error: "Access denied. You do not own this session." });
    }

    return await finalizeSessionEvaluation(session, res);
  } catch (err) {
    next(err);
  }
};

/**
 * GET USER INTERVIEW HISTORY
 * Returns completed and recorded mock interviews from MongoDB.
 * GET /api/interview/history
 */
exports.getInterviewHistory = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { userId };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [total, sessions] = await Promise.all([
      InterviewSession.countDocuments(query),
      InterviewSession.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-questions.groundingContext")
    ]);

    const historyItems = sessions.map((s) => ({
      sessionId: s.sessionId,
      role: s.role,
      targetRole: s.role,
      difficulty: s.difficulty,
      difficultyLevel: s.difficulty,
      mode: s.mode,
      interviewMode: s.mode,
      status: s.status,
      date: s.createdAt,
      createdAt: s.createdAt,
      completedAt: s.finalReport?.completedAt || s.updatedAt,
      totalQuestions: s.totalQuestions,
      questionsAnswered: s.answers.length,
      finalScore: s.finalReport?.finalScore || 0,
      score: s.finalReport?.finalScore ? Math.round(s.finalReport.finalScore * 10) : 0,
      rating: s.finalReport?.rating || (s.status === "completed" ? "Completed" : "In Progress"),
      categoryScores: s.finalReport?.categoryScores || {}
    }));

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      history: historyItems,
      sessions: historyItems
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET DETAILED INTERVIEW REPORT
 * Returns 5-part rubric evaluations, category radar metrics, strengths & weaknesses.
 * GET /api/interview/:sessionId/report
 */
exports.getInterviewReport = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    const session = await InterviewSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, error: "Interview report not found." });
    }

    if (String(session.userId) !== userId) {
      return res.status(403).json({ success: false, error: "Access denied. You do not own this report." });
    }

    const transcript = session.questions.map((q, idx) => ({
      questionIndex: idx + 1,
      question: q.question,
      category: q.category,
      format: q.format,
      difficulty: q.difficulty,
      answer: session.answers[idx]?.answer || "",
      isSkipped: session.answers[idx]?.isSkipped || false,
      evaluation: session.evaluations[idx] || null
    }));

    const sessionData = {
      sessionId: session.sessionId,
      role: session.role,
      targetRole: session.role,
      difficulty: session.difficulty,
      difficultyLevel: session.difficulty,
      mode: session.mode,
      interviewMode: session.mode,
      status: session.status,
      reportStatus: session.reportStatus || (session.status === "completed" ? "completed" : "not_started"),
      createdAt: session.createdAt,
      completedAt: session.finalReport?.completedAt || session.updatedAt,
      finalScore: session.finalReport?.finalScore || 0,
      categoryScores: session.finalReport?.categoryScores || {},
      introEvaluation: session.finalReport?.introEvaluation || null,
      sectionSummaries: session.finalReport?.sectionSummaries || {},
      strengths: session.finalReport?.strengths || [],
      weaknesses: session.finalReport?.areasOfImprovement || [],
      preparationPlan: session.finalReport?.preparationPlan || [],
      coverageSummary: session.finalReport?.coverageSummary || {},
      feedback: session.finalReport?.feedback || "",
      finalReport: session.finalReport,
      questionsAnswered: session.answers.length,
      totalQuestions: session.totalQuestions,
      transcript
    };

    res.json({
      success: true,
      session: sessionData,
      ...sessionData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET DASHBOARD ANALYTICS
 * Aggregates real user statistics across all completed mock interviews.
 * GET /api/interview/analytics
 */
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    const completedSessions = await InterviewSession.find({
      userId,
      status: "completed"
    }).sort({ createdAt: 1 });

    const totalCompleted = completedSessions.length;
    if (totalCompleted === 0) {
      return res.json({
        success: true,
        analytics: {
          totalInterviews: 0,
          completedInterviews: 0,
          averageScore: 0,
          highestScore: 0,
          recentScore: 0,
          categoryAverages: {
            correctness: 0,
            clarity: 0,
            depth: 0,
            relevance: 0,
            completeness: 0
          },
          scoreHistory: [],
          recentTrends: [],
          topStrengths: [],
          topImprovementAreas: []
        }
      });
    }

    const scores = completedSessions.map((s) => s.finalReport?.finalScore || 0);
    const averageScoreVal = roundScore(scores.reduce((a, b) => a + b, 0) / totalCompleted);
    const highestScoreVal = Math.max(...scores);
    const recentScoreVal = scores[scores.length - 1];

    // Compute category averages
    const categoryTotals = { correctness: 0, clarity: 0, depth: 0, relevance: 0, completeness: 0 };
    completedSessions.forEach((s) => {
      const cats = s.finalReport?.categoryScores || {};
      categoryTotals.correctness += cats.correctness || 0;
      categoryTotals.clarity += cats.clarity || 0;
      categoryTotals.depth += cats.depth || 0;
      categoryTotals.relevance += cats.relevance || 0;
      categoryTotals.completeness += cats.completeness || 0;
    });

    const categoryAverages = {
      correctness: roundScore(categoryTotals.correctness / totalCompleted),
      clarity: roundScore(categoryTotals.clarity / totalCompleted),
      depth: roundScore(categoryTotals.depth / totalCompleted),
      relevance: roundScore(categoryTotals.relevance / totalCompleted),
      completeness: roundScore(categoryTotals.completeness / totalCompleted)
    };

    const scoreHistory = completedSessions.map((s) => ({
      date: s.createdAt.toISOString().slice(0, 10),
      score: s.finalReport?.finalScore || 0,
      role: s.role
    }));

    // Aggregate common strengths and weaknesses
    const allStrengths = [];
    const allAreas = [];
    completedSessions.forEach((s) => {
      (s.finalReport?.strengths || []).forEach((str) => uniquePush(allStrengths, str));
      (s.finalReport?.areasOfImprovement || []).forEach((area) => uniquePush(allAreas, area));
    });

    res.json({
      success: true,
      analytics: {
        totalInterviews: totalCompleted,
        completedInterviews: totalCompleted,
        averageScore: averageScoreVal,
        highestScore: highestScoreVal,
        recentScore: recentScoreVal,
        categoryAverages,
        scoreHistory,
        recentTrends: scoreHistory,
        topStrengths: allStrengths.slice(0, 5),
        topImprovementAreas: allAreas.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }

};

/**
 * DOWNLOAD PDF / PRINTABLE REPORT
 * Generates clean, branded HTML/PDF transcript with score metrics.
 * GET /api/interview/:sessionId/pdf
 */
exports.downloadPdfReport = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    const session = await InterviewSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Report not found." });
    }

    if (String(session.userId) !== userId) {
      return res.status(403).json({ error: "Access denied." });
    }

    const report = session.finalReport || {};
    const candidateName = req.user.name || "Candidate";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PrepNova Performance Report - ${session.role}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 36px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .title { color: #4f46e5; font-size: 24px; font-weight: bold; margin: 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: #e0e7ff; color: #3730a3; font-weight: 600; font-size: 13px; }
    .score-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; }
    .score-val { font-size: 44px; font-weight: 800; color: #4f46e5; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .card h4 { margin-top: 0; margin-bottom: 8px; color: #0f172a; }
    .card ul { margin: 0; padding-left: 20px; }
    .question-block { border-left: 4px solid #6366f1; padding-left: 14px; margin-bottom: 20px; background: #fdfdfd; }
    .q-title { font-weight: bold; color: #1e293b; margin-bottom: 4px; }
    .q-answer { color: #475569; font-style: italic; margin-bottom: 6px; }
    .q-eval { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">PrepNova Mock Interview Performance Report</h1>
      <p style="margin: 4px 0 0 0; color: #64748b;">Candidate: ${candidateName} | Target Role: ${session.role}</p>
    </div>
    <div>
      <span class="badge">${session.difficulty.toUpperCase()} • ${session.mode.toUpperCase()}</span>
    </div>
  </div>


  <div class="score-card">
    <div class="score-val">${report.finalScore || 0} / 10</div>
    <div style="font-weight: 600; color: #334155; margin-top: 4px;">${report.rating || "Interview Assessment"}</div>
    <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">${report.feedback || ""}</p>
  </div>

  <div class="grid">
    <div class="card">
      <h4 style="color: #16a34a;">Key Strengths</h4>
      <ul>
        ${(report.strengths || []).map((s) => `<li>${s}</li>`).join("") || "<li>Demonstrated foundational understanding</li>"}
      </ul>
    </div>
    <div class="card">
      <h4 style="color: #ea580c;">Focus Areas for Improvement</h4>
      <ul>
        ${(report.areasOfImprovement || []).map((a) => `<li>${a}</li>`).join("") || "<li>Structure technical answers with practical trade-offs</li>"}
      </ul>
    </div>
  </div>

  <h3>Interview Transcript & Question Breakdown</h3>
  ${session.questions.map((q, idx) => `
    <div class="question-block">
      <div class="q-title">Q${idx + 1} (${q.category}): ${q.question}</div>
      <div class="q-answer"><strong>Candidate Answer:</strong> ${session.answers[idx]?.answer || (session.answers[idx]?.isSkipped ? "[Skipped]" : "No response")}</div>
      <div class="q-eval">
        <strong>Score:</strong> ${session.evaluations[idx]?.score || 0}/10 | <strong>Feedback:</strong> ${session.evaluations[idx]?.feedback || "Evaluated."}
      </div>
    </div>
  `).join("")}

  <div style="text-align: center; margin-top: 36px; font-size: 12px; color: #94a3b8;">
    Generated by PrepNova RAG-Based Adaptive Mock Interview Platform • ${new Date().toLocaleDateString()}
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="PrepNova_Report_${session.sessionId}.html"`);
    res.send(htmlContent);
  } catch (err) {
    next(err);
  }
};

/**
 * VALIDATE INPUTS & RESUME-JD FIT CHECK
 * Supports all 7 combinations with explainable 6-dimension fit evaluation,
 * critical gap detection, and actionable user recommendations.
 * POST /api/interview/validate and POST /api/interview/fit-check
 */
exports.validateInputs = async (req, res, next) => {
  try {
    const { role, resumeId, jdId, mode } = req.body;
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    let resumeData = null;
    let jdData = null;

    if (resumeId) {
      const resumeDoc = await Resume.findOne({ documentId: resumeId, userId });
      if (resumeDoc) {
        resumeData = {
          skills: resumeDoc.parsedData?.skills || [],
          experience: resumeDoc.parsedData?.experience || [],
          projects: resumeDoc.parsedData?.projects || [],
          education: resumeDoc.parsedData?.education || [],
          raw_text: resumeDoc.rawText || ""
        };
      }
    }

    if (jdId) {
      const jdDoc = await JobDescription.findOne({ documentId: jdId, userId });
      if (jdDoc) {
        jdData = {
          role_title: jdDoc.parsedData?.role_title || jdDoc.parsedData?.title || jdDoc.title || "",
          required_skills: jdDoc.parsedData?.required_skills || [],
          preferred_skills: jdDoc.parsedData?.preferred_skills || [],
          experience_level: jdDoc.parsedData?.experience_level || "",
          responsibilities: jdDoc.parsedData?.responsibilities || [],
          raw_text: jdDoc.rawText || ""
        };
      }
    }

    const validationResult = await aiServiceClient.validateInputs({
      mode: mode || (resumeId && jdId && role ? "resume_jd_role" : resumeId && jdId ? "resume_jd" : resumeId && role ? "resume_role" : resumeId ? "resume" : jdId && role ? "role_jd" : jdId ? "jd" : "role"),
      targetRole: role || null,
      resume: resumeData,
      jd: jdData,
      userId,
      resumeId,
      jdId
    });

    return res.json({
      success: true,
      ...validationResult
    });
  } catch (err) {
    next(err);
  }
};

