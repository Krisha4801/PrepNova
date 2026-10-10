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

    // Determine interview mode according to combination rules
    let mode = "role";
    let selectedRole = String(role || "").trim();

    if (resumeId && jdId) {
      mode = "resume_jd";
    } else if (resumeId) {
      mode = "resume";
    } else if (selectedRole && jdId) {
      mode = "role_jd";
    } else if (selectedRole) {
      mode = "role";
    } else {
      return res.status(400).json({
        error: "Insufficient context: Either a target role selection or an uploaded resume is required to start an interview."
      });
    }

    if (!selectedRole && resumeId) {
      // Fetch resume from DB to get candidate name/detected role
      const resumeDoc = await Resume.findOne({ documentId: resumeId, userId });
      if (resumeDoc && resumeDoc.detectedRole) {
        selectedRole = resumeDoc.detectedRole;
      } else {
        selectedRole = "Software Engineer";
      }
    }

    const selectedLevel = normalizeLevel(level) || "beginner";
    const sessionId = createSessionId();

    // Call LangGraph AI engine for context-grounded question
    let generatedQ;
    try {
      generatedQ = await aiServiceClient.generateInterviewQuestion({
        userId,
        role: selectedRole,
        difficulty: selectedLevel,
        mode,
        resumeId,
        jdId,
        focusAreas: Array.isArray(focusAreas) ? focusAreas : []
      });
    } catch (aiErr) {
      // Fallback to local LLM / question bank
      const fallback = await fallbackGenerateQuestion(selectedRole, selectedLevel);
      generatedQ = {
        id: fallback.id || `q_${Date.now()}`,
        question: fallback.question,
        category: "Technical Concept",
        format: "Scenario",
        difficulty: fallback.level || selectedLevel,
        expected_concepts: [selectedRole],
        expectedAnswer: fallback.expectedAnswer,
        source: fallback.source || "fallback",
        role: selectedRole
      };
    }

    const firstQuestionItem = {
      questionId: generatedQ.id || `q_1_${Date.now()}`,
      question: generatedQ.question,
      category: generatedQ.category || "Technical Concept",
      format: generatedQ.format || "Scenario",
      difficulty: generatedQ.difficulty || selectedLevel,
      groundingContext: generatedQ.grounding_context || null,
      expectedConcepts: generatedQ.expected_concepts || [],
      expectedAnswer: generatedQ.expectedAnswer || null,
      source: generatedQ.source || "langgraph_rag"
    };

    // Create durable session in MongoDB
    const sessionDoc = await InterviewSession.create({
      userId,
      sessionId,
      role: selectedRole,
      difficulty: selectedLevel,
      mode,
      resumeId: resumeId || null,
      jdId: jdId || null,
      status: "in_progress",
      totalQuestions: MAX_QUESTIONS,
      questionCount: 1,
      questions: [firstQuestionItem],
      answers: [],
      evaluations: []
    });

    activeSessionCache.set(sessionId, sessionDoc.toObject());

    res.status(200).json({
      sessionId,
      question: firstQuestionItem.question,
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
        total: MAX_QUESTIONS
      }
    });
  } catch (err) {
    next(err);
  }

};

/**
 * SUBMIT ANSWER & ADVANCE INTERVIEW
 * Evaluates candidate answer via 5-part rubric, adapts difficulty, and advances session.
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

    const currentIndex = session.answers.length;
    const currentQuestion = session.questions[currentIndex] || session.questions[session.questions.length - 1];

    // Evaluate answer with LangGraph AI engine
    let evaluation;
    try {
      const evalResp = await aiServiceClient.evaluateInterviewAnswer({
        role: session.role,
        difficulty: currentQuestion.difficulty || session.difficulty,
        question: currentQuestion.question,
        answer: String(answer).trim(),
        groundingContext: currentQuestion.groundingContext,
        format: currentQuestion.format,
        expectedConcepts: currentQuestion.expectedConcepts
      });

      evaluation = {
        questionIndex: currentIndex,
        score: roundScore(evalResp.score),
        relevance: roundScore(evalResp.relevance || evalResp.score),
        correctness: roundScore(evalResp.correctness || evalResp.score),
        completeness: roundScore(evalResp.completeness || evalResp.score),
        clarity: roundScore(evalResp.clarity || evalResp.score),
        depth: roundScore(evalResp.depth || evalResp.score),
        ratingLabel: evalResp.rating_label || ratingLabel(evalResp.score),
        feedback: evalResp.feedback || "Answer evaluated.",
        strengths: evalResp.strengths || [],
        areasOfImprovement: evalResp.areas_of_improvement || [],
        matchedConcepts: evalResp.matched_concepts || [],
        missedConcepts: evalResp.missed_concepts || [],
        referenceAnswer: evalResp.reference_answer || null,
        nextDifficulty: evalResp.next_difficulty || session.difficulty
      };
    } catch (aiErr) {
      // Fallback local evaluation
      const fallback = await fallbackEvaluateAnswer(
        session.role,
        currentQuestion.difficulty || session.difficulty,
        currentQuestion,
        answer
      );
      evaluation = {
        questionIndex: currentIndex,
        score: roundScore(fallback.rating || 6.0),
        relevance: roundScore(fallback.correctness || 6.0),
        correctness: roundScore(fallback.correctness || 6.0),
        completeness: roundScore(fallback.depth || 6.0),
        clarity: roundScore(fallback.clarity || 6.0),
        depth: roundScore(fallback.depth || 6.0),
        ratingLabel: ratingLabel(fallback.rating || 6.0),
        feedback: fallback.feedback || "Answer evaluated.",
        strengths: fallback.strengths || [],
        areasOfImprovement: fallback.areasOfImprovement || [],
        matchedConcepts: fallback.matchedConcepts || [],
        missedConcepts: fallback.missedConcepts || [],
        referenceAnswer: fallback.referenceAnswer || null,
        nextDifficulty: nextDifficulty(currentQuestion.difficulty || session.difficulty, fallback.rating || 6.0)
      };
    }

    // Record answer and evaluation in MongoDB
    session.answers.push({
      questionIndex: currentIndex,
      answer: String(answer).trim(),
      isSkipped: false,
      audioUsed: !!audioUsed,
      submittedAt: new Date()
    });
    session.evaluations.push(evaluation);

    // Check if interview completed
    if (session.answers.length >= session.totalQuestions) {
      const finalReport = buildFinalFeedback(session.evaluations);
      session.status = "completed";
      session.finalReport = finalReport;
      await session.save();
      activeSessionCache.delete(sessionId);

      return res.json({
        completed: true,
        evaluation,
        finalReport,
        ...finalReport
      });
    }

    // Determine adaptive difficulty for next question
    const previousLevel = currentQuestion.difficulty || session.difficulty;
    const nextLevel = nextDifficulty(previousLevel, evaluation.score);
    session.difficulty = nextLevel;

    // Generate next question via LangGraph
    let nextQ;
    try {
      const historyItems = session.questions.map((q, idx) => ({
        question: q.question,
        answer: session.answers[idx]?.answer || "",
        score: session.evaluations[idx]?.score || null,
        level: q.difficulty
      }));

      nextQ = await aiServiceClient.generateInterviewQuestion({
        userId,
        role: session.role,
        difficulty: nextLevel,
        mode: session.mode,
        resumeId: session.resumeId,
        jdId: session.jdId,
        history: historyItems,
        askedQuestionIds: session.questions.map((q) => q.questionId).filter(Boolean)
      });
    } catch (nextErr) {
      const fallback = await fallbackGenerateQuestion(session.role, nextLevel, {
        excludeIds: session.questions.map((q) => q.questionId).filter(Boolean)
      });
      nextQ = {
        id: fallback.id || `q_${Date.now()}`,
        question: fallback.question,
        category: "Technical Concept",
        format: "Scenario",
        difficulty: fallback.level || nextLevel,
        expected_concepts: [session.role],
        source: "fallback"
      };
    }

    const nextQuestionItem = {
      questionId: nextQ.id || `q_${session.questions.length + 1}_${Date.now()}`,
      question: nextQ.question,
      category: nextQ.category || "Technical Concept",
      format: nextQ.format || "Scenario",
      difficulty: nextQ.difficulty || nextLevel,
      groundingContext: nextQ.grounding_context || null,
      expectedConcepts: nextQ.expected_concepts || [],
      expectedAnswer: nextQ.expectedAnswer || null,
      source: nextQ.source || "langgraph_rag"
    };

    session.questions.push(nextQuestionItem);
    session.questionCount = session.questions.length;
    await session.save();
    activeSessionCache.set(sessionId, session.toObject());

    res.json({
      completed: false,
      evaluation,
      question: nextQuestionItem.question,
      nextQuestion: nextQuestionItem.question,
      category: nextQuestionItem.category,
      format: nextQuestionItem.format,
      level: nextQuestionItem.difficulty,
      source: nextQuestionItem.source,
      levelChanged: previousLevel !== nextQuestionItem.difficulty,
      previousLevel,
      desiredLevel: nextLevel,
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

    const skippedEval = buildSkippedEvaluation(currentQuestion, currentIndex);
    session.answers.push({

      questionIndex: currentIndex,
      answer: "",
      isSkipped: true,
      audioUsed: false,
      submittedAt: new Date()
    });
    session.evaluations.push(skippedEval);

    if (session.answers.length >= session.totalQuestions) {
      const finalReport = buildFinalFeedback(session.evaluations);
      session.status = "completed";
      session.finalReport = finalReport;
      await session.save();
      activeSessionCache.delete(sessionId);

      return res.json({
        skipped: true,
        completed: true,
        evaluation: skippedEval,
        finalReport,
        ...finalReport
      });
    }

    // Step down difficulty on skipped question
    const nextLevel = nextDifficulty(currentQuestion.difficulty || session.difficulty, 0);
    session.difficulty = nextLevel;

    const fallback = await fallbackGenerateQuestion(session.role, nextLevel);
    const nextQuestionItem = {
      questionId: fallback.id || `q_${Date.now()}`,
      question: fallback.question,
      category: "Technical Concept",
      format: "Scenario",
      difficulty: nextLevel,
      source: fallback.source || "fallback"
    };

    session.questions.push(nextQuestionItem);
    session.questionCount = session.questions.length;
    await session.save();

    res.json({
      skipped: true,
      completed: false,
      evaluation: skippedEval,
      question: nextQuestionItem.question,
      nextQuestion: nextQuestionItem.question,
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
 * END / ABANDON INTERVIEW
 * DELETE /api/interview/:sessionId
 */
exports.endInterview = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user ? String(req.user._id || req.user.id) : null;

    const session = await InterviewSession.findOne({ sessionId });
    if (session) {
      if (String(session.userId) !== userId) {
        return res.status(403).json({ error: "Access denied. You do not own this session." });
      }
      if (session.status !== "completed") {
        session.status = "abandoned";
        await session.save();
      }
      activeSessionCache.delete(sessionId);
    }

    res.json({ ended: true, sessionId });
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
      createdAt: session.createdAt,
      completedAt: session.finalReport?.completedAt || session.updatedAt,
      finalScore: session.finalReport?.finalScore || 0,
      categoryScores: session.finalReport?.categoryScores || {},
      strengths: session.finalReport?.strengths || [],
      weaknesses: session.finalReport?.areasOfImprovement || [],
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
