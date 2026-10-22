const mongoose = require("mongoose");

const QuestionItemSchema = new mongoose.Schema(
  {
    questionId: { type: String, default: null },
    question: { type: String, required: true },
    category: { type: String, default: "Technical Concept" },
    format: { type: String, default: "Scenario" },
    difficulty: { type: String, default: "beginner" },
    groundingContext: { type: String, default: null },
    expectedConcepts: { type: [String], default: [] },
    expectedAnswer: { type: String, default: null },
    source: { type: String, default: "rag_llm" },
    sectionId: { type: String, default: "introduction" },
    questionType: { type: String, enum: ["primary", "follow_up"], default: "primary" },
    parentQuestionId: { type: String, default: null },
    reasonCode: { type: String, default: null },
    expectedEvidence: { type: [String], default: [] },
    estimatedSeconds: { type: Number, default: 60 }
  },
  { _id: false }
);

const AnswerItemSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    turnId: { type: String, default: null },
    sectionId: { type: String, default: "introduction" },
    answer: { type: String, default: "" },
    isSkipped: { type: Boolean, default: false },
    audioUsed: { type: Boolean, default: false },
    evaluationStatus: {
      type: String,
      enum: ["pending", "evaluated", "skipped"],
      default: "pending"
    },
    submittedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const EvaluationItemSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, default: 0 },
    question_index: { type: Number, default: 0 },
    sectionId: { type: String, default: null },
    section_id: { type: String, default: null },
    score: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 },
    correctness: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    depth: { type: Number, default: 0 },
    ratingLabel: { type: String, default: "Interview ready" },
    feedback: { type: String, default: "" },
    strengths: { type: [String], default: [] },
    areasOfImprovement: { type: [String], default: [] },
    matchedConcepts: { type: [String], default: [] },
    missedConcepts: { type: [String], default: [] },
    referenceAnswer: { type: String, default: null },
    nextDifficulty: { type: String, default: "beginner" }
  },
  { _id: false }
);

const FinalReportSchema = new mongoose.Schema(
  {
    finalScore: { type: Number, default: 0 },
    rating: { type: String, default: "Needs practice" },
    categoryScores: {
      correctness: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 }
    },
    introEvaluation: {
      score: { type: Number, default: 8.0 },
      structure: { type: String, default: "" },
      roleRelevance: { type: String, default: "" },
      evidence: { type: String, default: "" },
      conciseness: { type: String, default: "" },
      clarity: { type: String, default: "" },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      sampleImprovedAnswer: { type: String, default: null }
    },
    sectionSummaries: { type: mongoose.Schema.Types.Mixed, default: {} },
    strengths: { type: [String], default: [] },
    areasOfImprovement: { type: [String], default: [] },
    preparationPlan: { type: [String], default: [] },
    coverageSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
    evaluations: { type: [EvaluationItemSchema], default: [] },
    feedback: { type: String, default: "" },
    completedAt: { type: Date, default: Date.now },
    durationSeconds: { type: Number, default: 0 }
  },
  { _id: false }
);

const InterviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    role: {
      type: String,
      required: false,
      default: "Candidate",
      trim: true
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },
    mode: {
      type: String,
      enum: ["resume_jd_role", "resume_jd", "resume_role", "resume", "role_jd", "jd", "role"],
      default: "role"
    },
    resumeId: {
      type: String,
      default: null
    },
    jdId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["preparing", "in_progress", "evaluating", "completed", "evaluation_failed", "abandoned"],
      default: "in_progress",
      index: true
    },
    reportStatus: {
      type: String,
      enum: ["not_started", "pending", "running", "completed", "failed"],
      default: "not_started",
      index: true
    },
    blueprint: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    totalQuestions: {
      type: Number,
      default: 6
    },
    questionCount: {
      type: Number,
      default: 1
    },
    questions: {
      type: [QuestionItemSchema],
      default: []
    },
    answers: {
      type: [AnswerItemSchema],
      default: []
    },
    evaluations: {
      type: [EvaluationItemSchema],
      default: []
    },
    finalReport: {
      type: FinalReportSchema,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("InterviewSession", InterviewSessionSchema);

