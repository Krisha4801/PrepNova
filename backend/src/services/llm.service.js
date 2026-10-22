const axios = require("axios");
const {
  LEVELS,
  evaluateAnswerLocally,
  findQuestion,
  getAvailableRoles,
  normalizeLevel,
  resolveRole
} = require("./questionBank.service");

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const BASE_CONTEXT = `
You are an ethical, realistic, industry-level technical interviewer.
Ask concise interview questions and evaluate answers fairly for the selected role and difficulty.
`;

function clampScore(score) {
  return Math.max(0, Math.min(10, Number(score) || 0));
}

function roundScore(score) {
  return Math.round(clampScore(score) * 10) / 10;
}

async function callGroq(messages, maxTokens = 400) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Add it to backend/.env before using LLM fallback.");
  }

  const response = await axios.post(
    GROQ_URL,
    {
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.4
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content.trim();
}

function parseJsonResponse(content) {
  const cleaned = String(content || "")
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("LLM did not return valid JSON.");
    }

    return JSON.parse(jsonMatch[0]);
  }
}

function normalizeEvaluation(rawEvaluation, source) {
  const correctness = roundScore(rawEvaluation.correctness);
  const clarity = roundScore(rawEvaluation.clarity);
  const depth = roundScore(rawEvaluation.depth);
  const rating = roundScore(rawEvaluation.rating || ((correctness + clarity + depth) / 3));
  const areas = Array.isArray(rawEvaluation.areasOfImprovement)
    ? rawEvaluation.areasOfImprovement
    : rawEvaluation.areas_of_improvement;

  return {
    source,
    correctness,
    clarity,
    depth,
    rating,
    feedback: rawEvaluation.feedback || "Answer evaluated.",
    strengths: Array.isArray(rawEvaluation.strengths)
      ? rawEvaluation.strengths.map(String)
      : [],
    areasOfImprovement: Array.isArray(areas) && areas.length
      ? areas.map(String)
      : ["Add more specific evidence, examples, and trade-offs."],
    matchedConcepts: Array.isArray(rawEvaluation.matchedConcepts)
      ? rawEvaluation.matchedConcepts.map(String)
      : [],
    missedConcepts: Array.isArray(rawEvaluation.missedConcepts)
      ? rawEvaluation.missedConcepts.map(String)
      : [],
    referenceAnswer: rawEvaluation.referenceAnswer || null
  };
}

exports.generateQuestion = async (role, level, options = {}) => {
  const normalizedLevel = normalizeLevel(level) || "beginner";
  const textQuestion = findQuestion({
    role,
    level: normalizedLevel,
    excludeIds: options.excludeIds || []
  });

  if (textQuestion.found) {
    return {
      id: textQuestion.id,
      source: textQuestion.source,
      role: textQuestion.role,
      requestedRole: role,
      level: textQuestion.level,
      question: textQuestion.question,
      expectedAnswer: textQuestion.expectedAnswer
    };
  }

  const prompt = `
Role: ${role}
Difficulty: ${normalizedLevel}

Ask exactly one interview question for this role and difficulty.
Do not include the answer.
Make the question specific enough that an answer can be scored.
`;

  const question = await callGroq(
    [
      { role: "system", content: BASE_CONTEXT },
      { role: "user", content: prompt }
    ],
    250
  );

  return {
    id: null,
    source: "llm",
    role: resolveRole(role) || role,
    requestedRole: role,
    level: normalizedLevel,
    question,
    expectedAnswer: null
  };
};

exports.generateFollowupQuestion = async (role, level, answer) => {
  const normalizedLevel = normalizeLevel(level) || "beginner";

  return callGroq(
    [
      { role: "system", content: BASE_CONTEXT },
      {
        role: "user",
        content: `
Role: ${role}
Difficulty: ${normalizedLevel}
Candidate answer: "${answer}"

Ask one logical follow-up interview question.
`
      }
    ],
    300
  );
};

exports.evaluateAnswer = async (role, level, questionRecord, answer) => {
  const answerText = String(answer || "").trim();
  const normalizedAnswer = answerText.toLowerCase().replace(/[^a-z0-9']+/g, " ").trim();
  if (!normalizedAnswer || /^(?:idk|i do not know|i don't know|i dont know|dont know|no idea|i have no idea|not sure|i am not sure|i'm not sure|no clue|pass|skip|i cannot answer|i can't answer)$/.test(normalizedAnswer)) {
    return {
      source: "non_answer",
      correctness: 0,
      clarity: 0,
      depth: 0,
      rating: 0,
      feedback: "This response did not demonstrate knowledge of the question. Review the reference answer and try again.",
      strengths: [],
      areasOfImprovement: ["Address the question with a relevant concept and a brief explanation."],
      matchedConcepts: [],
      missedConcepts: [],
      referenceAnswer: questionRecord?.expectedAnswer || null
    };
  }

  const expectedConcepts = questionRecord?.expectedConcepts || questionRecord?.expected_concepts || [];
  const rubricRecord = questionRecord && {
    ...questionRecord,
    expectedAnswer: questionRecord.expectedAnswer
      || questionRecord.expected_answer
      || questionRecord.groundingContext
      || questionRecord.grounding_context
      || (Array.isArray(expectedConcepts) ? expectedConcepts.join(" ") : String(expectedConcepts))
  };
  const localEvaluation = evaluateAnswerLocally(rubricRecord, answer);

  if (localEvaluation) {
    return localEvaluation;
  }

  if (!process.env.GROQ_API_KEY) {
    const wordCount = answerText.split(/\s+/).filter(Boolean).length;
    const depthCue = /\b(because|example|trade-?off|impact|constraint|risk|measure|however|in practice)\b/i.test(answerText);
    const clarity = roundScore(Math.min(4, 1 + Math.min(wordCount, 30) / 15));
    const depth = depthCue ? 2 : 1;
    const correctness = 1;
    return {
      source: "limited_rubric",
      correctness,
      clarity,
      depth,
      rating: roundScore((correctness * 0.5) + (clarity * 0.25) + (depth * 0.25)),
      feedback: "The answer was saved, but a reliable correctness score was unavailable because this question has no reference rubric and GROQ_API_KEY is not configured.",
      strengths: [],
      areasOfImprovement: ["Configure GROQ_API_KEY or provide reference concepts for reliable answer evaluation."],
      matchedConcepts: [],
      missedConcepts: Array.isArray(expectedConcepts) ? expectedConcepts.map(String) : [],
      referenceAnswer: null
    };
  }

  const normalizedLevel = normalizeLevel(level) || "beginner";
  const prompt = `
Role: ${role}
Difficulty: ${normalizedLevel}
Question: ${questionRecord.question || questionRecord}
Candidate answer: ${answer}

Evaluate the answer as an interviewer.
Return JSON only in this exact shape:
{
  "correctness": number,
  "clarity": number,
  "depth": number,
  "rating": number,
  "feedback": "short feedback",
  "areasOfImprovement": ["specific improvement area"]
}
Scores must be from 0 to 10.
`;

  const content = await callGroq(
    [
      { role: "system", content: "You are a strict but helpful technical interviewer. Return valid JSON only." },
      { role: "user", content: prompt }
    ],
    350
  );

  return normalizeEvaluation(parseJsonResponse(content), "llm");
};

exports.LEVELS = LEVELS;
exports.getAvailableRoles = getAvailableRoles;
exports.normalizeLevel = normalizeLevel;
