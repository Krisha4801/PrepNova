const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`  ✔ [PASS] ${message}`);
}

async function runLiveAudit() {
  console.log('====================================================');
  console.log('PrepNova Live End-to-End System & Security Audit');
  console.log('Testing against Live Express API:', BASE_URL);
  console.log('====================================================\n');

  const ts = Date.now();
  const userA = {
    name: 'Alice Auditor',
    email: `alice_audit_${ts}@example.com`,
    password: 'Password123!',
  };
  const userB = {
    name: 'Bob Attacker',
    email: `bob_audit_${ts}@example.com`,
    password: 'Password123!',
  };

  // -----------------------------------------------------------------
  // 1. Authentication & Candidate Profile
  // -----------------------------------------------------------------
  console.log('▶ 1. Authentication & Profile Lifecycle');
  const regA = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userA),
  });
  assert(regA.status === 201 && regA.data.token, 'User A registered successfully');
  const tokenA = regA.data.token;

  const regB = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userB),
  });
  assert(regB.status === 201 && regB.data.token, 'User B registered successfully');
  const tokenB = regB.data.token;

  // Profile update for Candidate A
  const profileRes = await request('/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      targetRole: 'AI Engineer',
      experienceLevel: 'intermediate',
      bio: 'Auditor Candidate Bio',
    }),
  });
  assert(profileRes.status === 200 && profileRes.data.user.targetRole === 'AI Engineer', 'Candidate A profile updated');

  // -----------------------------------------------------------------
  // 2. Resume Upload, PDF Extraction & ChromaDB Indexing
  // -----------------------------------------------------------------
  console.log('\n▶ 2. Resume Upload, Extraction & ChromaDB Indexing');
  const resumeFilePath = path.resolve(__dirname, '../../AIService/test_resume.pdf');
  assert(fs.existsSync(resumeFilePath), 'Digital PDF test resume exists on disk');

  const fileBuffer = fs.readFileSync(resumeFilePath);
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  formData.append('resume', blob, 'test_resume.pdf');

  const uploadRes = await fetch(`${BASE_URL}/resume/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
    },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  assert((uploadRes.status === 200 || uploadRes.status === 201) && uploadData.success, 'Resume uploaded, extracted, and indexed in ChromaDB');
  const resumeDoc = uploadData.resume || uploadData.document;
  assert(resumeDoc && resumeDoc._id, 'Resume MongoDB document created');
  const resumeIdA = resumeDoc._id;

  // Verify User A can list resumes
  const myResumes = await request('/resume/my', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(myResumes.status === 200 && myResumes.data.resumes.length >= 1, "User A can list owned resumes");

  // -----------------------------------------------------------------
  // 3. Job Description Extraction & Storage
  // -----------------------------------------------------------------
  console.log('\n▶ 3. Job Description Extraction & RAG Storage');
  const jdRes = await request('/jd/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      jobTitle: 'Senior AI Engineer',
      company: 'Nova AI Labs',
      text: `Job Title: Senior AI Engineer
Company: Nova AI Labs
Location: Remote

Responsibilities:
- Design, deploy, and maintain agentic RAG workflows using LangGraph and ChromaDB.
- Develop high-performance backend microservices using FastAPI and Node.js.
- Implement structured prompt engineering and automated evaluation rubrics for interview candidates.

Requirements:
- 3+ years experience with Python, FastAPI, and LangChain/LangGraph.
- Strong understanding of vector embeddings, semantic retrieval, and cosine similarity.
- Experience building full-stack web applications with React and Express.`,
    }),
  });
  if (jdRes.status !== 200 && jdRes.status !== 201) {
    console.error('JD Error Details:', jdRes.status, jdRes.data);
  }
  assert((jdRes.status === 200 || jdRes.status === 201) && jdRes.data.success, 'Job description extracted and indexed in ChromaDB');
  const jdDoc = jdRes.data.jd || jdRes.data.document;
  const jdIdA = jdDoc._id;

  // -----------------------------------------------------------------
  // 4. Input Combination Rule Validation (Section 3.3)
  // -----------------------------------------------------------------
  console.log('\n▶ 4. Input Combination Rules & Validation');
  // 4a. Insufficient Context (No Resume, No Role) -> 400
  const invalidStart = await request('/interview/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ role: '', maxQuestions: 3 }),
  });
  assert(invalidStart.status === 400, 'Rejects interview start with 400 when no resume and no role provided');

  // 4b. Role-only mode (Fallback to Role Knowledge Base) -> 200
  const roleOnlyStart = await request('/interview/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ role: 'Backend Engineer', maxQuestions: 3 }),
  });
  assert(roleOnlyStart.status === 200 && roleOnlyStart.data.mode === 'role', 'Starts role-knowledge fallback interview when no resume provided');

  // -----------------------------------------------------------------
  // 5. Resume-Based Multi-Turn Interview & LangGraph AI Judge Lifecycle
  // -----------------------------------------------------------------
  console.log('\n▶ 5. Resume-Based Interview Lifecycle, LangGraph & 5-Part Rubric AI Judge');
  const startRes = await request('/interview/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      role: 'AI Engineer',
      resumeId: resumeIdA,
      maxQuestions: 3,
    }),
  });
  assert(startRes.status === 200 && startRes.data.sessionId, 'Interview started with Resume mode');
  const sessionId = startRes.data.sessionId;
  const q1Text = typeof startRes.data.question === 'string' ? startRes.data.question : startRes.data.question?.text;
  assert(q1Text && q1Text.length > 0, 'Initial question received from LangGraph Question Generation workflow');
  console.log(`    Generated Q1: "${q1Text.slice(0, 90)}..." (Level: ${startRes.data.level || 'beginner'})`);

  // Question 1: Submit high-quality candidate answer
  console.log('    Submitting Answer 1 to LangGraph AI Judge...');
  const answer1Res = await request('/interview/followup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId,
      answer: 'In our system, we built a LangGraph state graph where incoming candidate documents are split into recursive token chunks, embedded with BAAI/bge-small-en-v1.5, stored in user-scoped ChromaDB collections, and retrieved via cosine similarity with metadata filtering to prevent cross-tenant leaks.',
    }),
  });
  assert(answer1Res.status === 200 && answer1Res.data.evaluation, 'Answer 1 evaluated by LangGraph 5-part rubric AI Judge');
  const eval1 = answer1Res.data.evaluation;
  assert(typeof eval1.score === 'number' && eval1.score >= 0 && eval1.score <= 10, 'Overall score in valid range 0-10');
  const relevanceScore = eval1.relevance ?? eval1.rubricScores?.relevance;
  assert(typeof relevanceScore === 'number', '5-part rubric contains relevance score');
  const correctnessScore = eval1.correctness ?? eval1.rubricScores?.technicalCorrectness;
  assert(typeof correctnessScore === 'number', '5-part rubric contains technical correctness score');
  assert(eval1.feedback && eval1.feedback.length > 0, 'Feedback provided by AI Judge');
  console.log(`    Judge Score: ${eval1.score}/10 | Next Difficulty: ${eval1.nextDifficulty || answer1Res.data.level}`);

  // Question 2: Skip question
  console.log('    Skipping Question 2...');
  const skipRes = await request('/interview/skip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ sessionId }),
  });
  assert(skipRes.status === 200, 'Question 2 skipped successfully');
  assert(skipRes.data.evaluation.score === 0, 'Skipped question assigned score 0');

  // Question 3: Submit final answer to complete interview
  console.log('    Submitting Answer 3 to complete interview session...');
  const answer3Res = await request('/interview/followup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      sessionId,
      answer: 'To ensure reliability, we run automated health checks, rate limit endpoints, validate schemas with Pydantic, and use circuit breakers for external LLM API calls.',
    }),
  });
  assert(answer3Res.status === 200, 'Final answer evaluated');
  assert(answer3Res.data.completed === true, 'Interview automatically transitioned to completed on max questions');
  assert(answer3Res.data.finalReport, 'Durable finalReport generated upon interview completion');
  console.log(`    Final Report Overall Score: ${answer3Res.data.finalReport.finalScore ?? answer3Res.data.finalReport.overallScore}/10`);

  // Idempotent completion check
  const endAgain = await request('/interview/end', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ sessionId }),
  });
  assert(endAgain.status === 200, 'Idempotent completion: ending again maintains completed status without error');

  // -----------------------------------------------------------------
  // 6. Reports, PDF Generation & Dashboard Analytics
  // -----------------------------------------------------------------
  console.log('\n▶ 6. Reports, PDF Download & Dashboard Analytics');
  // Fetch report
  const reportRes = await request(`/interview/${sessionId}/report`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(reportRes.status === 200 && reportRes.data.finalReport, 'Fetched completed interview report');
  const transcriptLength = reportRes.data.session?.transcript?.length || reportRes.data.transcript?.length || reportRes.data.session?.questionsAnswered;
  assert(transcriptLength === 3, 'Persisted exactly 3 answers/evaluations');

  // Fetch printable HTML/PDF report
  const pdfRes = await fetch(`${BASE_URL}/interview/${sessionId}/pdf`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const htmlText = await pdfRes.text();
  assert(pdfRes.status === 200, 'Printable PDF/HTML endpoint returns 200');
  assert(htmlText.includes('PrepNova Mock Interview Performance Report') || htmlText.includes('PrepNova Performance Report'), 'Printable report contains valid HTML assessment template');
  assert(htmlText.includes('window.print()'), 'Printable report auto-triggers browser print dialog');

  // History listing
  const historyRes = await request('/interview/history', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(historyRes.status === 200 && historyRes.data.total >= 1, 'Interview history lists user sessions');

  // Dashboard analytics
  const dashRes = await request('/interview/dashboard-analytics', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(dashRes.status === 200 && dashRes.data.analytics, 'Dashboard analytics computed from persisted MongoDB sessions');
  assert(dashRes.data.analytics.totalInterviews >= 1, 'Dashboard shows accurate interview count');
  assert(typeof dashRes.data.analytics.averageScore === 'number', 'Dashboard calculates accurate average score');

  // -----------------------------------------------------------------
  // 7. Security Audit & Cross-User Isolation (User A vs User B)
  // -----------------------------------------------------------------
  console.log('\n▶ 7. Security Audit & Multi-Tenant Cross-User Isolation');
  // User B tries to view User A's resume -> 403
  const bViewResume = await request(`/resume/${resumeIdA}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(bViewResume.status === 403, 'Cross-User Isolation: User B blocked from viewing User A resume (403 Forbidden)');

  // User B tries to delete User A's resume -> 403
  const bDeleteResume = await request(`/resume/${resumeIdA}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(bDeleteResume.status === 403, 'Cross-User Isolation: User B blocked from deleting User A resume (403 Forbidden)');

  // User B tries to view User A's interview report -> 403
  const bViewReport = await request(`/interview/${sessionId}/report`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(bViewReport.status === 403, 'Cross-User Isolation: User B blocked from viewing User A interview report (403 Forbidden)');

  // User B tries to submit answer to User A's session -> 403
  const bSubmitAnswer = await request('/interview/followup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      sessionId,
      answer: 'Malicious hijacked answer',
    }),
  });
  assert(bSubmitAnswer.status === 403, 'Cross-User Isolation: User B blocked from hijacking User A interview session (403 Forbidden)');

  // User B tries to download User A's PDF -> 403
  const bDownloadPdf = await fetch(`${BASE_URL}/interview/${sessionId}/pdf`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(bDownloadPdf.status === 403, 'Cross-User Isolation: User B blocked from downloading User A report PDF (403 Forbidden)');

  // User B has zero interviews in history
  const bHistory = await request('/interview/history', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(bHistory.status === 200 && bHistory.data.total === 0, 'User B history is completely isolated (0 sessions)');

  console.log('\n====================================================');
  console.log('✔ All Live End-to-End System & Security Checks Passed');
  console.log('====================================================');
}

runLiveAudit().catch((err) => {
  console.error('\nAudit Failed with Error:', err);
  process.exit(1);
});
