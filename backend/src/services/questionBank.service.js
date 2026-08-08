const fs = require("fs");
const path = require("path");

const RAG_DIR = path.join(__dirname, "../../rag");
const LEVELS = ["beginner", "intermediate", "advanced"];

const ROLE_ALIASES = {
  frontend: ["front end", "frontend developer", "ui developer", "react developer", "web developer"],
  backend: ["back end", "backend developer", "api developer", "server developer", "node developer"],
  fullstack: ["full stack", "full-stack", "fullstack developer", "mern", "mean"],
  aiml: ["ai", "ml", "ai ml", "ai/ml", "ai-ml", "artificial intelligence", "machine learning", "ml engineer", "ai engineer"],
  data: ["data analyst", "data engineer", "data science", "database"],
  cloud: ["cloud engineer", "aws", "azure", "gcp", "devops"],
  hr: ["human resources", "recruiter", "talent acquisition"],
  finance: ["financial analyst", "accounting", "fintech"],
  manager: ["project manager", "product manager", "people manager", "management"]
};

const ROLE_PROFILES = {
  frontend: {
    label: "Frontend Developer",
    topics: ["accessibility", "state management", "rendering performance", "component design", "browser storage", "web security"]
  },
  backend: {
    label: "Backend Developer",
    topics: ["API design", "database indexing", "authentication", "caching", "observability", "failure handling"]
  },
  fullstack: {
    label: "Fullstack Developer",
    topics: ["client-server integration", "authentication", "deployment", "database design", "API contracts", "performance"]
  },
  aiml: {
    label: "AI/ML Engineer",
    topics: ["model evaluation", "feature engineering", "overfitting", "embeddings", "training data quality", "deployment monitoring"]
  },
  data: {
    label: "Data Analyst",
    topics: ["data cleaning", "metrics", "SQL joins", "dashboards", "data quality", "trend analysis"]
  },
  cloud: {
    label: "Cloud Engineer",
    topics: ["autoscaling", "containers", "networking", "cost control", "monitoring", "high availability"]
  },
  hr: {
    label: "HR",
    topics: ["recruitment", "onboarding", "employee engagement", "retention", "policy communication", "performance reviews"]
  },
  finance: {
    label: "Finance",
    topics: ["cash flow", "risk", "forecasting", "financial controls", "profitability", "budget variance"]
  },
  manager: {
    label: "Manager",
    topics: ["prioritization", "conflict resolution", "delegation", "goal setting", "stakeholder communication", "team performance"]
  },
  general: {
    label: "Candidate",
    topics: ["problem solving", "quality", "collaboration", "trade-offs", "execution", "communication"]
  }
};

const FALLBACK_TEMPLATES = {
  beginner: [
    {
      question: "Explain {topic} in the context of a {role}.",
      expectedAnswer: "A strong answer defines {topic}, explains why it matters, and gives a simple practical example for the {role} role."
    },
    {
      question: "What problem does {topic} solve for a {role}?",
      expectedAnswer: "{topic} should be tied to a real problem, the benefit it creates, and one basic example of how it is used."
    },
    {
      question: "How would you recognize good {topic} in day-to-day {role} work?",
      expectedAnswer: "Good {topic} can be recognized by clear outcomes, fewer mistakes, better user or business impact, and measurable improvement."
    },
    {
      question: "Give one simple example of using {topic} as a {role}.",
      expectedAnswer: "The answer should include a concrete example, the action taken, and the reason that action improves the result."
    }
  ],
  intermediate: [
    {
      question: "How would you make a trade-off decision involving {topic}?",
      expectedAnswer: "A strong answer compares options, names trade-offs, explains constraints, and justifies the decision with impact or risk."
    },
    {
      question: "Describe a practical workflow for improving {topic}.",
      expectedAnswer: "The workflow should include diagnosis, implementation steps, validation, and a way to measure the improvement."
    },
    {
      question: "What signals would tell you that {topic} needs attention?",
      expectedAnswer: "The answer should name observable signals, likely causes, and a next step for investigation or improvement."
    },
    {
      question: "How would you explain {topic} to a teammate who is new to the project?",
      expectedAnswer: "A good explanation should define the concept, connect it to the project, show an example, and mention a common pitfall."
    }
  ],
  advanced: [
    {
      question: "How would you design a scalable approach to {topic}?",
      expectedAnswer: "A strong answer covers architecture, bottlenecks, failure modes, observability, trade-offs, and how success is measured."
    },
    {
      question: "What failure modes would you consider when working with {topic}?",
      expectedAnswer: "The answer should identify realistic failures, impact, mitigation, monitoring, and recovery plans."
    },
    {
      question: "How would you evaluate whether an investment in {topic} was worth it?",
      expectedAnswer: "A strong answer defines success metrics, compares costs and benefits, considers risks, and validates results after rollout."
    },
    {
      question: "Walk through a high-level plan for improving {topic} across a team or system.",
      expectedAnswer: "The plan should include prioritization, stakeholder alignment, phased execution, measurement, risks, and iteration."
    }
  ]
};

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "into", "used", "uses",
  "use", "using", "are", "is", "was", "were", "will", "you", "your", "can",
  "how", "what", "why", "when", "where", "which", "than", "then", "they",
  "them", "their", "has", "have", "had", "about", "also", "such", "like",
  "e", "g", "etc", "one", "two", "three", "answer", "strong", "clear",
  "good", "basic", "simple", "candidate", "role", "work", "working", "context",
  "way", "ways", "allow", "allows", "allowed", "allowing"
]);

const SYNONYM_GROUPS = [
  ["api", "endpoint", "route", "interface", "contract"],
  ["communicate", "communication", "connect", "exchange", "interact", "talk", "request", "response"],
  ["software", "system", "service", "application", "app", "program"],
  ["semantic", "meaning", "meaningful", "structure", "tag", "html"],
  ["accessibility", "accessible", "alt", "screenreader", "screen", "reader", "seo"],
  ["async", "asynchronous", "parallel", "defer", "deferred", "nonblocking"],
  ["blocking", "block", "parsing", "parse", "execute", "execution"],
  ["storage", "store", "stored", "persist", "persistent", "session", "local"],
  ["security", "secure", "xss", "csp", "policy", "risk", "attack"],
  ["layout", "box", "grid", "flexbox", "position", "stacking", "rendering"],
  ["state", "props", "context", "hook", "component", "react"],
  ["virtual", "dom", "diff", "reconciliation", "hydrate", "hydration"],
  ["performance", "fast", "speed", "latency", "optimize", "optimization", "cache", "caching", "cdn"],
  ["database", "data", "store", "storage", "query", "index", "sql"],
  ["auth", "authentication", "authorization", "token", "jwt", "session"],
  ["rest", "resource", "graphql", "query", "endpoint"],
  ["scale", "scaling", "scalable", "autoscale", "autoscaling", "capacity"],
  ["failure", "fail", "fault", "error", "outage", "recovery", "resilience"],
  ["prevent", "avoid", "stop", "reduce", "mitigate", "protect"],
  ["cloud", "remote", "server", "hosted", "infrastructure"],
  ["container", "docker", "package", "dependency", "isolation"],
  ["kubernetes", "orchestration", "orchestrate", "cluster", "pod"],
  ["machine", "learning", "model", "training", "prediction", "data"],
  ["embedding", "vector", "numeric", "representation", "meaning"],
  ["fine", "tuning", "finetune", "custom", "adapt"],
  ["reinforcement", "reward", "policy", "agent", "feedback"],
  ["recruitment", "hire", "hiring", "candidate", "screening"],
  ["onboarding", "training", "orientation", "ramp"],
  ["retention", "retain", "engagement", "employee"],
  ["revenue", "income", "sales", "earnings"],
  ["profit", "ebitda", "interest", "tax", "depreciation", "amortization"],
  ["cash", "flow", "npv", "present", "value", "discount"],
  ["risk", "loss", "uncertainty", "exposure"],
  ["leadership", "guide", "guiding", "support", "direction"],
  ["conflict", "disagreement", "mediation", "communication"],
  ["okr", "objective", "key", "result", "goal"],
  ["delegate", "delegation", "structure", "ownership", "team"]
];

const DEPTH_CUES = [
  "because", "for example", "example", "trade", "tradeoff", "trade-off", "depends",
  "constraint", "risk", "impact", "measure", "metric", "monitor", "edge", "however",
  "but", "therefore", "so that", "in practice", "real", "production"
];

const LOW_EFFORT_PATTERNS = [
  /^(idk|i do not know|i don't know|dont know|no idea|not sure|maybe)$/i,
  /^(yes|no|ok|okay|fine)$/i
];

let cachedEntries = null;

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalRole(value) {
  const normalized = normalize(value).replace(/\s+/g, "");

  if (["aiml", "ai", "ml", "artificialintelligence", "machinelearning"].includes(normalized)) {
    return "aiml";
  }

  if (normalized === "humanresources") {
    return "hr";
  }

  if (normalized === "fullstackdeveloper") {
    return "fullstack";
  }

  return normalized || "general";
}

function titleize(value) {
  return normalize(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeLevel(level) {
  const normalized = normalize(level);
  const compact = normalized.replace(/\s+/g, "");

  if (LEVELS.includes(normalized)) {
    return normalized;
  }

  if (["easy", "junior", "entry", "entrylevel", "basic"].includes(compact)) {
    return "beginner";
  }

  if (["medium", "mid", "midlevel"].includes(compact)) {
    return "intermediate";
  }

  if (["hard", "senior", "expert"].includes(compact)) {
    return "advanced";
  }

  return null;
}

function parseQuestionLine(line, fileRole, lineNumber) {
  const trimmed = line.trim();

  if (!trimmed || !trimmed.includes("|")) {
    return null;
  }

  const [leftSide, ...answerParts] = trimmed.split("|");
  const expectedAnswer = answerParts.join("|").trim();
  const tags = [...leftSide.matchAll(/\[([^\]]+)\]/g)].map((match) => normalize(match[1]));
  const levelIndex = tags.findIndex((tag) => LEVELS.includes(tag));
  const level = levelIndex >= 0 ? tags[levelIndex] : null;
  const roleFromTag = levelIndex > 0 ? tags[levelIndex - 1] : fileRole;
  const role = canonicalRole(roleFromTag || fileRole);
  const question = leftSide.replace(/\[[^\]]+\]/g, "").trim();

  if (!role || !level || !question || !expectedAnswer) {
    return null;
  }

  return {
    id: `${fileRole}:${lineNumber}`,
    source: "txt",
    company: tags[0] || null,
    role,
    level,
    question,
    expectedAnswer
  };
}

function loadQuestionBank() {
  if (cachedEntries) {
    return cachedEntries;
  }

  if (!fs.existsSync(RAG_DIR)) {
    cachedEntries = [];
    return cachedEntries;
  }

  const files = fs.readdirSync(RAG_DIR).filter((file) => file.toLowerCase().endsWith(".txt"));

  cachedEntries = files.flatMap((file) => {
    const fileRole = canonicalRole(path.basename(file, ".txt"));
    const filePath = path.join(RAG_DIR, file);
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

    return lines
      .map((line, index) => parseQuestionLine(line, fileRole, index + 1))
      .filter(Boolean);
  });

  return cachedEntries;
}

function getAvailableRoles() {
  return [...new Set(loadQuestionBank().map((entry) => entry.role))].sort();
}

function resolveRole(role) {
  const normalizedInput = normalize(role);

  if (!normalizedInput) {
    return null;
  }

  const roles = getAvailableRoles();
  const compactInput = normalizedInput.replace(/\s+/g, "");

  const exactRole = roles.find((candidate) => candidate === compactInput || normalize(candidate) === normalizedInput);
  if (exactRole) {
    return exactRole;
  }

  const aliasRole = roles.find((candidate) => {
    const aliases = ROLE_ALIASES[candidate] || [];
    return aliases.some((alias) => {
      const normalizedAlias = normalize(alias);
      const compactAlias = normalizedAlias.replace(/\s+/g, "");
      return normalizedInput.includes(normalizedAlias)
        || normalizedAlias.includes(normalizedInput)
        || compactInput.includes(compactAlias)
        || compactAlias.includes(compactInput);
    });
  });

  if (aliasRole) {
    return aliasRole;
  }

  return roles.find((candidate) => {
    const normalizedCandidate = normalize(candidate);
    return normalizedInput.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedInput);
  }) || null;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function levelDistance(a, b) {
  const aIndex = LEVELS.indexOf(a);
  const bIndex = LEVELS.indexOf(b);

  if (aIndex === -1 || bIndex === -1) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.abs(aIndex - bIndex);
}

function nearestLevelPool(entries, targetLevel) {
  if (!entries.length) {
    return [];
  }

  const bestDistance = Math.min(...entries.map((entry) => levelDistance(entry.level, targetLevel)));
  return entries.filter((entry) => levelDistance(entry.level, targetLevel) === bestDistance);
}

function profileFor(roleKey, requestedRole) {
  const profile = ROLE_PROFILES[roleKey] || ROLE_PROFILES.general;
  const label = profile === ROLE_PROFILES.general && requestedRole
    ? titleize(requestedRole)
    : profile.label;

  return {
    ...profile,
    label: label || ROLE_PROFILES.general.label
  };
}

function interpolate(template, replacements) {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }, template);
}

function buildFallbackQuestions(roleKey, requestedRole, level) {
  const normalizedRole = roleKey || canonicalRole(requestedRole);
  const profile = profileFor(normalizedRole, requestedRole);
  const templates = FALLBACK_TEMPLATES[level] || FALLBACK_TEMPLATES.beginner;

  return templates.map((template, index) => {
    const topic = profile.topics[index % profile.topics.length];
    const replacements = {
      role: profile.label,
      topic
    };

    return {
      id: `fallback:${normalizedRole}:${level}:${index}`,
      source: "local",
      company: null,
      role: normalizedRole,
      level,
      question: interpolate(template.question, replacements),
      expectedAnswer: interpolate(template.expectedAnswer, replacements)
    };
  });
}

function findQuestion({ role, level, excludeIds = [] }) {
  const resolvedRole = resolveRole(role);
  const roleKey = resolvedRole || canonicalRole(role);
  const normalizedLevel = normalizeLevel(level) || "beginner";
  const excluded = new Set(excludeIds);
  const roleEntries = resolvedRole
    ? loadQuestionBank().filter((entry) => entry.role === resolvedRole)
    : [];

  const freshSameLevel = roleEntries.filter(
    (entry) => entry.level === normalizedLevel && !excluded.has(entry.id)
  );

  if (freshSameLevel.length) {
    return {
      found: true,
      ...randomItem(freshSameLevel)
    };
  }

  const fallbackSameLevel = buildFallbackQuestions(roleKey, role, normalizedLevel)
    .filter((entry) => !excluded.has(entry.id));

  if (fallbackSameLevel.length) {
    return {
      found: true,
      ...randomItem(fallbackSameLevel)
    };
  }

  const freshAnyLevel = roleEntries.filter((entry) => !excluded.has(entry.id));

  if (freshAnyLevel.length) {
    return {
      found: true,
      ...randomItem(nearestLevelPool(freshAnyLevel, normalizedLevel))
    };
  }

  const fallbackAnyLevel = LEVELS
    .flatMap((fallbackLevel) => buildFallbackQuestions(roleKey, role, fallbackLevel))
    .filter((entry) => !excluded.has(entry.id));

  if (fallbackAnyLevel.length) {
    return {
      found: true,
      ...randomItem(nearestLevelPool(fallbackAnyLevel, normalizedLevel))
    };
  }

  return {
    found: false,
    role: resolvedRole,
    level: normalizedLevel,
    reason: "No fresh question is available."
  };
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function stemToken(token) {
  if (token.endsWith("ies") && token.length > 5) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("ing") && token.length > 6) {
    return token.slice(0, -3);
  }

  if (token.endsWith("ed") && token.length > 5) {
    return token.slice(0, -2);
  }

  if (token.endsWith("es") && token.length > 5) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && token.length > 3) {
    return token.slice(0, -1);
  }

  if (token.length <= 4) {
    return token;
  }

  return token;
}

const SYNONYM_LOOKUP = SYNONYM_GROUPS.reduce((lookup, group) => {
  const [canonical] = group;

  group.forEach((term) => {
    tokenize(term).forEach((token) => {
      lookup[token] = canonical;
      lookup[stemToken(token)] = canonical;
    });
  });

  return lookup;
}, {});

function conceptKey(token) {
  const stemmed = stemToken(token);
  return SYNONYM_LOOKUP[token] || SYNONYM_LOOKUP[stemmed] || stemmed;
}

function conceptsFrom(value) {
  const seen = new Map();

  tokenize(value).forEach((token) => {
    const key = conceptKey(token);

    if (!seen.has(key)) {
      seen.set(key, token);
    }
  });

  return [...seen.entries()].map(([key, label]) => ({ key, label }));
}

function conceptCoverage(reference, answer) {
  const expectedConcepts = conceptsFrom(reference);
  const answerConcepts = new Set(conceptsFrom(answer).map((concept) => concept.key));

  if (!expectedConcepts.length) {
    return {
      coverage: 0,
      matched: [],
      missing: [],
      total: 0
    };
  }

  const matched = expectedConcepts.filter((concept) => answerConcepts.has(concept.key));
  const missing = expectedConcepts.filter((concept) => !answerConcepts.has(concept.key));

  return {
    coverage: matched.length / expectedConcepts.length,
    matched: matched.map((concept) => concept.label),
    missing: missing.map((concept) => concept.label),
    total: expectedConcepts.length
  };
}

function diceCoefficient(left, right) {
  const normalizedLeft = normalize(left).replace(/\s+/g, " ");
  const normalizedRight = normalize(right).replace(/\s+/g, " ");

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
    return Math.min(1, Math.min(normalizedLeft.length, normalizedRight.length) / Math.max(normalizedLeft.length, normalizedRight.length) + 0.25);
  }

  function bigrams(value) {
    const compact = ` ${value} `;
    const grams = [];

    for (let index = 0; index < compact.length - 1; index += 1) {
      grams.push(compact.slice(index, index + 2));
    }

    return grams;
  }

  const leftGrams = bigrams(normalizedLeft);
  const rightGrams = bigrams(normalizedRight);
  const rightCounts = rightGrams.reduce((counts, gram) => {
    counts[gram] = (counts[gram] || 0) + 1;
    return counts;
  }, {});

  const matches = leftGrams.reduce((count, gram) => {
    if (!rightCounts[gram]) {
      return count;
    }

    rightCounts[gram] -= 1;
    return count + 1;
  }, 0);

  return (2 * matches) / (leftGrams.length + rightGrams.length);
}

function conceptF1(reference, answer) {
  const expected = conceptsFrom(reference).map((concept) => concept.key);
  const actual = conceptsFrom(answer).map((concept) => concept.key);

  if (!expected.length || !actual.length) {
    return 0;
  }

  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const matches = [...expectedSet].filter((concept) => actualSet.has(concept)).length;
  const precision = matches / actualSet.size;
  const recall = matches / expectedSet.size;

  if (!precision || !recall) {
    return 0;
  }

  return (2 * precision * recall) / (precision + recall);
}

function referenceSimilarity(reference, answer) {
  const coverage = conceptCoverage(reference, answer).coverage;
  const f1 = conceptF1(reference, answer);
  const dice = diceCoefficient(reference, answer);

  return Math.max(coverage, f1, dice);
}

function clampScore(score) {
  return Math.max(0, Math.min(10, Number(score) || 0));
}

function roundScore(score) {
  return Math.round(clampScore(score) * 10) / 10;
}

function countDepthCues(answer) {
  const normalized = normalize(answer);
  return DEPTH_CUES.filter((cue) => normalized.includes(normalize(cue))).length;
}

function isLowEffortAnswer(answer, wordCount) {
  const trimmed = String(answer || "").trim();
  return wordCount < 3 || LOW_EFFORT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function answerTargetWordCount(questionRecord) {
  const expectedWords = tokenize(questionRecord.expectedAnswer || "").length;
  const isDefinitionQuestion = /^what is|^what are|^explain/i.test(String(questionRecord.question || "").trim());

  if (isDefinitionQuestion || expectedWords <= 6) {
    return 12;
  }

  return 24;
}

function isConciseReferenceQuestion(questionRecord) {
  const expectedWords = tokenize(questionRecord.expectedAnswer || "").length;
  const question = String(questionRecord.question || "").trim();

  return expectedWords <= 6 || /^what is|^what are|^explain|^difference between/i.test(question);
}

function uniqueItems(items) {
  return [...new Set(items.filter(Boolean))];
}

function evaluateAnswerLocally(questionRecord, answer) {
  if (!questionRecord || !questionRecord.expectedAnswer) {
    return null;
  }

  const cleanAnswer = String(answer || "").trim();
  const wordCount = cleanAnswer.split(/\s+/).filter(Boolean).length;
  const expected = conceptCoverage(questionRecord.expectedAnswer, cleanAnswer);
  const question = conceptCoverage(questionRecord.question || "", cleanAnswer);
  const similarity = referenceSimilarity(questionRecord.expectedAnswer, cleanAnswer);
  const conciseReference = isConciseReferenceQuestion(questionRecord);
  const completeness = Math.min(1, wordCount / answerTargetWordCount(questionRecord));
  const depthCueScore = Math.min(1, countDepthCues(cleanAnswer) / 3);
  const hasSentenceShape = /[.!?]$/.test(cleanAnswer) || wordCount >= 8;
  const lowEffort = isLowEffortAnswer(cleanAnswer, wordCount);

  if (!cleanAnswer) {
    return {
      source: "rubric",
      correctness: 0,
      clarity: 0,
      depth: 0,
      rating: 0,
      feedback: "No answer was provided.",
      strengths: [],
      areasOfImprovement: ["Write at least one clear sentence that addresses the question."],
      matchedConcepts: [],
      missedConcepts: expected.missing,
      referenceAnswer: questionRecord.expectedAnswer
    };
  }

  const relevance = Math.max(similarity, expected.coverage, question.coverage * 0.75);
  let correctness = 10 * (
    similarity * 0.78
    + question.coverage * 0.12
    + completeness * 0.1
  );

  let clarity = 10 * (
    Math.min(1, wordCount / 10) * 0.5
    + (hasSentenceShape ? 0.25 : 0.1)
    + Math.min(1, relevance + 0.2) * 0.25
  );

  let depth = 10 * (
    similarity * 0.48
    + completeness * 0.35
    + depthCueScore * 0.25
  );

  if (similarity >= 0.9) {
    correctness = Math.max(correctness, 9.2);
  } else if (similarity >= 0.78) {
    correctness = Math.max(correctness, 8.2);
  }

  if (conciseReference && similarity >= 0.72) {
    clarity = Math.max(clarity, 8.1);
    depth = Math.max(depth, 7.2);
  }

  if (relevance < 0.2) {
    correctness = Math.min(correctness, wordCount >= 18 ? 4.5 : 3.5);
    depth = Math.min(depth, wordCount >= 18 ? 5 : 3.5);
  }

  if (lowEffort) {
    correctness = Math.min(correctness, 2);
    clarity = Math.min(clarity, 3);
    depth = Math.min(depth, 2);
  }

  if (wordCount < 5 && similarity < 0.75) {
    correctness = Math.min(correctness, 5.5);
    clarity = Math.min(clarity, 5);
    depth = Math.min(depth, 4);
  }

  if (!lowEffort) {
    clarity = Math.min(clarity, correctness + 1.5);
    depth = Math.min(depth, correctness + 1.8);

    if (correctness >= 8) {
      clarity = Math.max(clarity, 7.6);
    }
  }

  correctness = roundScore(correctness);
  clarity = roundScore(clarity);
  depth = roundScore(depth);

  const rating = roundScore((correctness * 0.5) + (clarity * 0.25) + (depth * 0.25));
  const matchedConcepts = uniqueItems([...expected.matched, ...question.matched]).slice(0, 6);
  const missedConcepts = uniqueItems(expected.missing).slice(0, 6);
  const areasOfImprovement = [];
  const strengths = [];

  if (correctness >= 7) {
    strengths.push("Covers the core idea with relevant concepts.");
  } else if (missedConcepts.length) {
    areasOfImprovement.push(`Connect the answer to these concepts: ${missedConcepts.slice(0, 4).join(", ")}.`);
  } else {
    areasOfImprovement.push("Tie the answer more directly to the question being asked.");
  }

  if (clarity >= 7) {
    strengths.push("The explanation is easy to follow.");
  } else {
    areasOfImprovement.push("Use a cleaner structure: definition, reason, example.");
  }

  if (depth >= 7) {
    strengths.push("Includes enough detail for the selected difficulty.");
  } else {
    areasOfImprovement.push("Add a concrete example, trade-off, or impact statement.");
  }

  const opener = rating >= 8
    ? "Strong answer."
    : rating >= 6
      ? "Solid start."
      : rating >= 4
        ? "Partially correct, but incomplete."
        : "The answer needs a clearer connection to the question.";

  const conceptSentence = matchedConcepts.length
    ? `Covered: ${matchedConcepts.slice(0, 3).join(", ")}.`
    : "It did not include enough role-specific signal.";

  return {
    source: "rubric",
    correctness,
    clarity,
    depth,
    rating,
    feedback: `${opener} ${conceptSentence}`,
    strengths: strengths.length ? strengths : ["You made an attempt, but it needs more specific evidence."],
    areasOfImprovement: uniqueItems(areasOfImprovement).slice(0, 4),
    matchedConcepts,
    missedConcepts,
    referenceAnswer: questionRecord.expectedAnswer
  };
}

module.exports = {
  LEVELS,
  findQuestion,
  evaluateAnswerLocally,
  getAvailableRoles,
  normalizeLevel,
  resolveRole
};
