// Comprehensive interview question generator based on role, interview types, difficulty, and focus skills

const defaultQuestions = [
  {
    id: 'tech-1',
    category: 'Technical',
    type: 'technical',
    difficulty: 'Medium',
    estimatedTime: '2-3 min',
    title: 'Explain how the Virtual DOM works and how reconciliation optimizes UI rendering.',
    context: 'Assume an enterprise dashboard with frequent streaming updates and complex nested component trees.',
    hint: 'Mention diffing algorithm, key prop necessity, and batching state updates in React fiber architecture.',
    sampleAnswer: 'The Virtual DOM is an in-memory representation of the real DOM. When state changes, a new VDOM tree is created and diffed against the previous one using heuristic algorithms (O(n) complexity). Only changed nodes are batched and applied to the actual DOM, avoiding costly reflows and repaints.'
  },
  {
    id: 'hr-1',
    category: 'HR Behavioral',
    type: 'hr',
    difficulty: 'Medium',
    estimatedTime: '2 min',
    title: 'Describe a situation where you had a disagreement with a team member or technical lead. How did you resolve it?',
    context: 'Use the STAR method (Situation, Task, Action, Result) to structure your response.',
    hint: 'Focus on objective reasoning, data/benchmarking over personal preference, active listening, and team alignment.',
    sampleAnswer: 'In my previous project, our team lead preferred Redux for local form state, while I advocated for Zustand or React Hook Form to prevent re-renders. I built a quick prototype comparing bundle size and rendering performance. We reviewed the benchmarks together and agreed on using React Hook Form for forms and Redux for global session data, which improved input latency by 40%.'
  },
  {
    id: 'proj-1',
    category: 'Project-Based',
    type: 'project',
    difficulty: 'Medium',
    estimatedTime: '3 min',
    title: 'Walk me through the architecture of the most technically challenging project on your resume.',
    context: 'Highlight your role, technology choices, technical hurdles, and scalability decisions.',
    hint: 'Discuss system design trade-offs, state management, caching strategies, and how you handled latency or errors.',
    sampleAnswer: 'I built an AI-assisted evaluation engine. We used a Node/Express backend with Redis caching for LLM session context, and a Vite/React frontend. The key bottleneck was handling token streaming without UI freeze, which we solved by utilizing Server-Sent Events (SSE) with a Web Worker to parse incoming tokens off the main UI thread.'
  },
  {
    id: 'skill-1',
    category: 'Skill-Based',
    type: 'skill',
    difficulty: 'Medium',
    estimatedTime: '2-3 min',
    title: 'How do database indexes work under the hood, and when can indexing actually degrade performance?',
    context: 'Consider B-Trees, write amplification, and composite index column order.',
    hint: 'Think about read vs write tradeoffs and table cardinality.',
    sampleAnswer: 'Most relational databases use B-Tree or B+ Tree structures for indexing. They provide O(log n) lookups by keeping keys sorted. However, indexes degrade performance during heavy write/insert/update operations because each write must update the table and all related index trees, leading to write amplification and index fragmentation.'
  },
  {
    id: 'logic-1',
    category: 'Logic & Puzzle',
    type: 'logic',
    difficulty: 'Medium',
    estimatedTime: '3 min',
    title: 'Given a stream of integers where numbers are constantly incoming, how would you find the median at any point in time?',
    context: 'Focus on time complexity for both insertion and median retrieval.',
    hint: 'Consider using two priority queues (min-heap and max-heap) to balance the top and bottom halves.',
    sampleAnswer: 'We can maintain two heaps: a max-heap for the lower half of numbers and a min-heap for the upper half. For each incoming number, we balance the heaps such that their sizes differ by at most 1. Finding the median is then O(1) by inspecting the tops of the heaps, and insertion is O(log n).'
  },
  {
    id: 'scenario-1',
    category: 'Scenario-Based',
    type: 'scenario',
    difficulty: 'Hard',
    estimatedTime: '3 min',
    title: 'Your production web service is experiencing an unexpected 504 Gateway Timeout spike during peak user traffic. What is your systematic debugging protocol?',
    context: 'Assume microservices architecture with a load balancer, reverse proxy, API servers, and database.',
    hint: 'Check ingress logs, CPU/Memory metrics, database connection pool saturation, and third-party dependencies.',
    sampleAnswer: 'First, I check the load balancer metrics to determine whether the 504 is from the gateway timing out while reaching the backend service or the upstream service itself failing. Next, I inspect connection pools and slow query logs on the database. If workers are thread-blocked waiting for DB connections, I scale replicas and enable circuit-breakers for non-critical dependencies while rolling out a hotfix.'
  }
];

export function generateInterviewQuestions({
  targetRole = 'Software Engineer',
  interviewTypes = { technical: true, hr: true },
  difficulty = 'medium',
  focusSkills = ['React', 'DSA', 'SQL'],
  questionCount = 6
}) {
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const questions = [];

  // Match selected interview types
  const activeTypeKeys = Object.entries(interviewTypes)
    .filter(([_, active]) => Boolean(active))
    .map(([key]) => key);

  const matched = defaultQuestions.filter(q => activeTypeKeys.includes(q.type));

  // If we have focus skills, inject skill-specific questions
  if (focusSkills && focusSkills.length > 0) {
    focusSkills.forEach((skill, idx) => {
      questions.push({
        id: `custom-skill-${idx}`,
        category: `${skill} Deep Dive`,
        type: 'skill',
        difficulty: diffLabel,
        estimatedTime: '2-3 min',
        title: `In ${skill}, what are the most critical production trade-offs or performance bottlenecks you have encountered, and how did you mitigate them?`,
        context: `Focus on real-world engineering practices and internal mechanics relevant to a ${targetRole} position.`,
        hint: `Discuss concurrency, memory leaks, compilation/bundling, or state synchronization relevant to ${skill}.`,
        sampleAnswer: `When scaling ${skill} in production, careful attention must be paid to resource lifecycle and caching. For instance, avoiding unnecessary compute cycles and ensuring proper error boundaries makes the system resilient.`
      });
    });
  }

  // Combine matched base questions and skill questions
  const combined = [...matched, ...questions];

  // If less than questionCount, cycle or pad with defaults
  let finalPool = combined.length > 0 ? combined : defaultQuestions;
  const result = [];
  for (let i = 0; i < Math.max(questionCount, 5); i++) {
    const template = finalPool[i % finalPool.length];
    result.push({
      ...template,
      id: `q-${i + 1}`,
      questionNumber: i + 1,
      difficulty: diffLabel
    });
  }

  return result.slice(0, Math.min(questionCount, 12));
}
