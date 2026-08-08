const {
  LEVELS,
  evaluateAnswer,
  generateQuestion,
  getAvailableRoles,
  normalizeLevel
} = require("../services/llm.service");

const MAX_QUESTIONS = 6;
const sessions = {};

function createSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ratingLabel(score) {
  if (score >= 8.5) return "Excellent";
  if (score >= 7) return "Interview ready";
  if (score >= 5) return "Needs targeted practice";
  return "Needs fundamentals";
}

function nextDifficulty(currentLevel, rating) {
  const currentIndex = LEVELS.indexOf(currentLevel);

  if (currentIndex === -1) {
    return "beginner";
  }

  if (rating >= 8 && currentIndex < LEVELS.length - 1) {
    return LEVELS[currentIndex + 1];
  }

  if (rating <= 4.5 && currentIndex > 0) {
    return LEVELS[currentIndex - 1];
  }

  return currentLevel;
}

function averageScore(evaluations, field) {
  if (!evaluations.length) {
    return 0;
  }

  const total = evaluations.reduce((sum, item) => sum + Number(item.evaluation[field] || 0), 0);
  return Math.round((total / evaluations.length) * 10) / 10;
}

function uniquePush(items, value) {
  if (value && !items.includes(value)) {
    items.push(value);
  }
}

function strongestCategory(scores) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "correctness";
}

function weakestCategory(scores) {
  return Object.entries(scores).sort((a, b) => a[1] - b[1])[0]?.[0] || "depth";
}

function buildFinalFeedback(evaluations) {
  const finalScore = averageScore(evaluations, "rating");
  const correctness = averageScore(evaluations, "correctness");
  const clarity = averageScore(evaluations, "clarity");
  const depth = averageScore(evaluations, "depth");
  const categoryScores = {
    correctness,
    clarity,
    depth
  };
  const areas = [];
  const strengths = [];

  evaluations.forEach((item) => {
    (item.evaluation.strengths || []).forEach((strength) => {
      uniquePush(strengths, strength);
    });

    (item.evaluation.areasOfImprovement || []).forEach((area) => {
      uniquePush(areas, area);
    });
  });

  if (correctness < 7) {
    areas.unshift("Strengthen technical accuracy by naming the core concepts and constraints.");
  }

  if (depth < 7) {
    areas.unshift("Go deeper with examples, edge cases, and trade-offs.");
  }

  if (clarity < 7) {
    areas.unshift("Use a clear answer structure: definition, key point, example.");
  }

  const best = strongestCategory(categoryScores);
  const focus = weakestCategory(categoryScores);

  return {
    finalScore,
    rating: ratingLabel(finalScore),
    categoryScores,
    feedback: `${ratingLabel(finalScore)}: ${finalScore}/10 across ${evaluations.length} questions. Strongest area: ${best}. Main focus: ${focus}.`,
    strengths: strengths.slice(0, 4),
    areasOfImprovement: areas.slice(0, 5)
  };
}

function buildSkippedEvaluation(questionRecord) {
  return {
    source: "rubric",
    correctness: 0,
    clarity: 0,
    depth: 0,
    rating: 0,
    feedback: "Question skipped.",
    strengths: [],
    areasOfImprovement: [
      "Review the reference answer and try a concise definition-plus-example response next time."
    ],
    matchedConcepts: [],
    missedConcepts: [],
    referenceAnswer: questionRecord.expectedAnswer || null
  };
}

async function recordAndAdvance(sessionId, session, answer, evaluation) {
  session.evaluations.push({
    question: session.lastQuestion.question,
    level: session.currentLevel,
    source: session.lastQuestion.source,
    answer,
    evaluation
  });

  if (session.questionCount >= MAX_QUESTIONS) {
    const finalFeedback = buildFinalFeedback(session.evaluations);
    delete sessions[sessionId];

    return {
      completed: true,
      evaluation,
      ...finalFeedback
    };
  }

  const previousLevel = session.currentLevel;
  const desiredLevel = nextDifficulty(session.currentLevel, evaluation.rating);

  const nextQuestion = await generateQuestion(session.role, desiredLevel, {
    excludeIds: session.askedQuestionIds
  });

  session.questionCount += 1;
  session.lastQuestion = nextQuestion;
  session.currentLevel = nextQuestion.level;

  if (nextQuestion.id) {
    session.askedQuestionIds.push(nextQuestion.id);
  }

  return {
    completed: false,
    evaluation,
    question: nextQuestion.question,
    nextQuestion: nextQuestion.question,
    level: nextQuestion.level,
    source: nextQuestion.source,
    levelChanged: previousLevel !== nextQuestion.level,
    previousLevel,
    desiredLevel,
    progress: {
      current: session.questionCount,
      total: MAX_QUESTIONS
    }
  };
}

exports.startInterview = async (req, res) => {
  try {
    const { name, role, level } = req.body;
    const selectedRole = String(role || "").trim();
    const selectedLevel = normalizeLevel(level) || "beginner";

    if (!selectedRole) {
      return res.status(400).json({ error: "Role is required." });
    }

    const question = await generateQuestion(selectedRole, selectedLevel);
    const sessionId = createSessionId();

    sessions[sessionId] = {
      name: String(name || "Candidate").trim(),
      role: selectedRole,
      currentLevel: question.level,
      questionCount: 1,
      lastQuestion: question,
      askedQuestionIds: question.id ? [question.id] : [],
      evaluations: []
    };

    res.json({
      sessionId,
      question: question.question,
      level: question.level,
      source: question.source,
      matchedRole: question.role,
      availableRoles: getAvailableRoles(),
      availableLevels: LEVELS,
      progress: {
        current: 1,
        total: MAX_QUESTIONS
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to start interview." });
  }
};

exports.followup = async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    const session = sessions[sessionId];

    if (!session) {
      return res.status(400).json({ error: "Invalid session." });
    }

    if (!String(answer || "").trim()) {
      return res.status(400).json({ error: "Answer is required." });
    }

    const evaluation = await evaluateAnswer(
      session.role,
      session.currentLevel,
      session.lastQuestion,
      answer
    );

    res.json(await recordAndAdvance(sessionId, session, answer, evaluation));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Interview flow failed." });
  }
};

exports.skipQuestion = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = sessions[sessionId];

    if (!session) {
      return res.status(400).json({ error: "Invalid session." });
    }

    const evaluation = buildSkippedEvaluation(session.lastQuestion);
    const response = await recordAndAdvance(sessionId, session, "", evaluation);

    res.json({
      skipped: true,
      ...response
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not skip question." });
  }
};

exports.endInterview = (req, res) => {
  const { sessionId } = req.params;

  if (sessionId && sessions[sessionId]) {
    delete sessions[sessionId];
  }

  res.json({ ended: true });
};
