/**
 * PrepNova Section-Based Interview Practice Library
 * Comprehensive catalog of categorized technical and behavioral interview sections.
 */

export const SECTION_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'general', label: 'General & Behavioral' },
  { id: 'core_cs', label: 'Core Computer Science' },
  { id: 'frontend_fullstack', label: 'Frontend & Full Stack' },
  { id: 'backend_db', label: 'Backend & Databases' },
  { id: 'system_cloud', label: 'System, Cloud & DevOps' },
  { id: 'ai_data', label: 'AI, ML & Modern Tech' },
  { id: 'enterprise', label: 'Enterprise & Frameworks' }
];

export const INTERVIEW_SECTIONS_LIBRARY = [
  // 1. General Interview & HR
  {
    id: 'general_hr',
    name: 'General Interview & HR',
    category: 'general',
    categoryLabel: 'General & Behavioral',
    badge: 'HR / Culture',
    description: 'Culture fit, career trajectory, conflict resolution, work ethic, and behavioral STAR scenarios.',
    competencies: [
      'STAR Method',
      'Cross-Functional Collaboration',
      'Conflict Resolution',
      'Career Goals & Ownership',
      'Time Management & Prioritization'
    ],
    defaultObjective: 'Assess communication clarity, culture fit, situational judgment, and workplace interpersonal dynamics.',
    icon: 'Users'
  },

  // 2. Scenario-Based Questions
  {
    id: 'scenario_based',
    name: 'Scenario-Based Questions',
    category: 'general',
    categoryLabel: 'General & Behavioral',
    badge: 'Production & Outage',
    scenarioFocus: true,
    description: 'High-stakes production outages, technical debt trade-offs, architecture migration, and incident response.',
    competencies: [
      'P0 Incident Response',
      'Root Cause Analysis (RCA)',
      'Legacy Code Refactoring',
      'Stakeholder Trade-offs',
      'Zero-Downtime Migration'
    ],
    defaultObjective: 'Evaluate applied problem-solving under real-world production stress, unexpected bugs, and complex engineering trade-offs.',
    icon: 'AlertTriangle'
  },

  // 3. Programming Fundamentals & OOP
  {
    id: 'programming_oop',
    name: 'Programming Fundamentals & OOP',
    category: 'core_cs',
    categoryLabel: 'Core Computer Science',
    badge: 'OOP / Foundations',
    description: 'Object-Oriented Programming principles, design patterns (SOLID), memory management, and clean code principles.',
    competencies: [
      'Encapsulation & Polymorphism',
      'SOLID Principles',
      'Design Patterns (Factory, Singleton, Observer)',
      'Composition vs Inheritance',
      'Memory Management & Garbage Collection'
    ],
    defaultObjective: 'Assess foundational programming concepts, object-oriented design rigor, and clean maintainable code principles.',
    icon: 'Layers'
  },

  // 4. DSA (Data Structures & Algorithms)
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms (DSA)',
    category: 'core_cs',
    categoryLabel: 'Core Computer Science',
    badge: 'Algorithms',
    description: 'Arrays, Trees, Graphs, Dynamic Programming, asymptotic complexity (Big-O), search, and sorting algorithms.',
    competencies: [
      'Time & Space Complexity (Big-O)',
      'Binary Trees & Balanced BSTs',
      'Graph Traversals (BFS / DFS)',
      'Dynamic Programming & Recursion',
      'Hash Tables & Collision Handling'
    ],
    defaultObjective: 'Probe algorithmic optimization, data structure selection rationale, and computational complexity bounds.',
    icon: 'Code2'
  },

  // 5. JavaScript
  {
    id: 'javascript',
    name: 'JavaScript (ES6+)',
    category: 'frontend_fullstack',
    categoryLabel: 'Frontend & Full Stack',
    badge: 'Language Deep Dive',
    description: 'Event loop, async/await, closures, prototypes, microtask queue, scoping, hoisting, and modern ECMAScript features.',
    competencies: [
      'Event Loop & Concurrency Model',
      'Promises & Async/Await',
      'Closures & Lexical Scope',
      'Prototypes & Prototypal Inheritance',
      'Memory Leaks & V8 Engine Optimization'
    ],
    defaultObjective: 'Assess deep mechanics of JavaScript runtime, asynchronous patterns, and modern ECMAScript idioms.',
    icon: 'FileCode2'
  },

  // 6. React.js & Frontend
  {
    id: 'react_frontend',
    name: 'React.js & Frontend Development',
    category: 'frontend_fullstack',
    categoryLabel: 'Frontend & Full Stack',
    badge: 'Frontend UI',
    description: 'Virtual DOM, reconciliation, React 18+ hooks, custom hooks, state management, accessibility, and web performance.',
    competencies: [
      'React Hooks & Lifecycle',
      'State Management (Context, Zustand, Redux)',
      'Component Performance & Memoization',
      'DOM Reconciliation & Fiber Architecture',
      'Core Web Vitals & Hydration'
    ],
    defaultObjective: 'Examine component architecture, reactive state patterns, client-side caching, and frontend rendering optimization.',
    icon: 'Layout'
  },

  // 7. Node.js & Backend
  {
    id: 'nodejs_backend',
    name: 'Node.js & Backend Architecture',
    category: 'backend_db',
    categoryLabel: 'Backend & Databases',
    badge: 'Node / Runtime',
    description: 'Libuv thread pool, streams, Express/Fastify, REST & GraphQL APIs, middleware architecture, and non-blocking I/O.',
    competencies: [
      'Libuv & Event-Driven Architecture',
      'Streams & Buffers',
      'RESTful & GraphQL API Design',
      'Authentication (JWT, Sessions, OAuth)',
      'Clustering & Child Processes'
    ],
    defaultObjective: 'Evaluate scalable server-side patterns, streaming throughput, error handling pipelines, and async backend reliability.',
    icon: 'Server'
  },

  // 8. Full Stack Development
  {
    id: 'fullstack_dev',
    name: 'Full Stack Development',
    category: 'frontend_fullstack',
    categoryLabel: 'Frontend & Full Stack',
    badge: 'End-to-End',
    description: 'End-to-end application lifecycle, client-server contract synchronization, CORS, SSR/SSG, and fullstack security.',
    competencies: [
      'Client-Server Data Flow & WebSockets',
      'CORS, CSRF, and XSS Protection',
      'Server-Side Rendering (SSR) & Next.js',
      'Optimistic UI & Cache Revalidation',
      'End-to-End Integration Testing'
    ],
    defaultObjective: 'Probe end-to-end integration trade-offs, cohesive architecture design, and fullstack security hygiene.',
    icon: 'Laptop'
  },

  // 9. DBMS & SQL
  {
    id: 'dbms_sql',
    name: 'DBMS & SQL',
    category: 'backend_db',
    categoryLabel: 'Backend & Databases',
    badge: 'Relational & NoSQL',
    description: 'ACID properties, database normalization, indexing internals (B-Trees), query optimization, transactions, and joins.',
    competencies: [
      'ACID Guarantees & Transaction Isolation',
      'B-Tree & Hash Index Optimization',
      'Complex SQL Queries, Window Functions & Joins',
      'Database Normalization (1NF to 3NF/BCNF)',
      'NoSQL vs Relational Storage Trade-offs'
    ],
    defaultObjective: 'Assess data schema design, query execution plan analysis, index selection, and consistency guarantees.',
    icon: 'Database'
  },

  // 10. Operating Systems
  {
    id: 'operating_systems',
    name: 'Operating Systems',
    category: 'core_cs',
    categoryLabel: 'Core Computer Science',
    badge: 'OS Internals',
    description: 'Process vs thread, CPU scheduling, virtual memory, paging, deadlocks, semaphores, mutexes, and system calls.',
    competencies: [
      'Process & Thread Concurrency',
      'Virtual Memory & Demand Paging',
      'CPU Scheduling Algorithms',
      'Deadlock Prevention & Synchronization (Mutex/Semaphore)',
      'System Calls & Kernel vs User Mode'
    ],
    defaultObjective: 'Verify understanding of operating system resource allocation, low-level concurrency, and memory mechanics.',
    icon: 'Cpu'
  },

  // 11. Computer Networks
  {
    id: 'computer_networks',
    name: 'Computer Networks',
    category: 'core_cs',
    categoryLabel: 'Core Computer Science',
    badge: 'Networking',
    description: 'OSI 7 layers, TCP 3-way handshake, UDP, DNS resolution, HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS/SSL handshake, and CDNs.',
    competencies: [
      'TCP/IP & Reliable Transport (Congestion Control)',
      'HTTP/2 vs HTTP/3 (QUIC Protocol)',
      'TLS 1.3 Handshake & Encryption',
      'DNS Resolution & Anycast Routing',
      'WebSockets, gRPC, and Long Polling'
    ],
    defaultObjective: 'Assess networking protocols, network latency bottlenecks, protocol overhead, and distributed communication.',
    icon: 'Globe'
  },

  // 12. System Design & Architecture
  {
    id: 'system_design',
    name: 'System Design & Architecture',
    category: 'system_cloud',
    categoryLabel: 'System, Cloud & DevOps',
    badge: 'Distributed Scale',
    description: 'Microservices vs monoliths, load balancing, distributed caching (Redis), message queues (Kafka, RabbitMQ), and CAP theorem.',
    competencies: [
      'High Availability & Fault Tolerance',
      'Distributed Caching (LRU/LFU, Write-Through/Back)',
      'Message Queues & Event-Driven Architecture',
      'CAP Theorem & Consistent Hashing',
      'Database Sharding & Replication'
    ],
    defaultObjective: 'Challenge candidate on high-throughput scale, fault domain isolation, data consistency, and architectural trade-offs.',
    icon: 'Network'
  },

  // 13. AI, ML, LLM, RAG
  {
    id: 'ai_ml_llm_rag',
    name: 'AI, ML, LLM & RAG Systems',
    category: 'ai_data',
    categoryLabel: 'AI, ML & Modern Tech',
    badge: 'Generative AI & Data',
    description: 'Retrieval-Augmented Generation (RAG), vector embeddings, chunking strategies, prompt engineering, LLM fine-tuning, and ML evaluation.',
    competencies: [
      'RAG Architecture & Hybrid Search',
      'Vector Databases & Cosine Similarity',
      'Context Window Optimization & Prompt Tuning',
      'Model Hallucination Mitigation & Guardrails',
      'ML Model Evaluation (Precision, Recall, F1, BLEU)'
    ],
    defaultObjective: 'Assess modern AI engineering competencies, semantic search pipelines, embedding quality, and LLM orchestration.',
    icon: 'Sparkles'
  },

  // 14. Cloud & DevOps
  {
    id: 'cloud_devops',
    name: 'Cloud & DevOps',
    category: 'system_cloud',
    categoryLabel: 'System, Cloud & DevOps',
    badge: 'Infrastructure',
    description: 'Docker containerization, Kubernetes orchestration, CI/CD pipelines, AWS/GCP/Azure services, and Infrastructure as Code.',
    competencies: [
      'Docker Container Security & Multi-Stage Builds',
      'Kubernetes Pods, Services & Ingress Controllers',
      'CI/CD Pipelines (GitHub Actions, GitLab CI)',
      'Infrastructure as Code (Terraform)',
      'Cloud Observability (Prometheus, Grafana, OpenTelemetry)'
    ],
    defaultObjective: 'Evaluate cloud deployment automation, container orchestration, zero-downtime rollouts, and infrastructure resilience.',
    icon: 'Cloud'
  },

  // 15. Cybersecurity
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    category: 'system_cloud',
    categoryLabel: 'System, Cloud & DevOps',
    badge: 'Security & AppSec',
    description: 'OWASP Top 10, authentication/authorization (OAuth2/OIDC, RBAC), encryption (AES, RSA), secure coding, and vulnerability scanning.',
    competencies: [
      'OWASP Top 10 (SQLi, XSS, SSRF, IDOR)',
      'Zero Trust & Principle of Least Privilege',
      'OAuth 2.0 PKCE & Secure Token Storage',
      'Data Encryption at Rest & in Transit',
      'Threat Modeling & Security Auditing'
    ],
    defaultObjective: 'Assess security hygiene, vulnerability identification, defense-in-depth posture, and incident containment.',
    icon: 'ShieldCheck'
  },

  // 16. Software Engineering & Testing
  {
    id: 'software_testing',
    name: 'Software Engineering & Testing',
    category: 'core_cs',
    categoryLabel: 'Core Computer Science',
    badge: 'QA & Engineering',
    description: 'Unit, integration, and E2E testing, Test-Driven Development (TDD), CI test suites, code review practices, and refactoring.',
    competencies: [
      'Test-Driven Development (TDD) Lifecycle',
      'Unit, Integration, and Contract Testing',
      'Mocking, Stubs, and Flaky Test Mitigation',
      'Code Review Standards & Static Code Analysis',
      'Refactoring Without Regressions'
    ],
    defaultObjective: 'Examine software quality assurance rigor, automated test strategy, regression prevention, and maintainable engineering habits.',
    icon: 'CheckSquare'
  },

  // 17. Java, PHP, Laravel, Spring Boot
  {
    id: 'java_php_laravel_spring',
    name: 'Java, PHP, Laravel & Spring Boot',
    category: 'enterprise',
    categoryLabel: 'Enterprise & Frameworks',
    badge: 'Enterprise Backend',
    description: 'Spring Boot Dependency Injection, JPA/Hibernate, Java Streams, JVM tuning, Laravel Eloquent, Blade, and PHP 8+ modern features.',
    competencies: [
      'Spring Boot IoC & Dependency Injection',
      'Hibernate / JPA Entity Lifecycle & N+1 Problem',
      'Java Concurrency & JVM Garbage Collection Tuning',
      'Laravel Routing, Middleware & Eloquent ORM',
      'PHP 8+ Type Safety & Enterprise Design Patterns'
    ],
    defaultObjective: 'Probe enterprise backend frameworks, dependency injection architecture, ORM query tuning, and JVM/PHP production runtime performance.',
    icon: 'Coffee'
  }
];

/**
 * Finds a section definition by ID
 */
export function getSectionById(id) {
  if (!id) return null;
  return INTERVIEW_SECTIONS_LIBRARY.find((s) => s.id === id) || null;
}

/**
 * Returns formatted human-readable section name, with fallback for custom sections
 */
export function formatSectionTitle(sectionId) {
  if (!sectionId) return 'General';
  const found = getSectionById(sectionId);
  if (found) return found.name;

  return String(sectionId)
    .replace(/^custom_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Filter sections by search query and category
 */
export function filterSections(sections, query = '', category = 'all') {
  let filtered = sections || INTERVIEW_SECTIONS_LIBRARY;

  if (category && category !== 'all') {
    filtered = filtered.filter((s) => s.category === category);
  }

  const cleanQuery = String(query || '').trim().toLowerCase();
  if (cleanQuery) {
    filtered = filtered.filter((s) => {
      const matchName = s.name.toLowerCase().includes(cleanQuery);
      const matchDesc = s.description.toLowerCase().includes(cleanQuery);
      const matchCategory = (s.categoryLabel || '').toLowerCase().includes(cleanQuery);
      const matchBadge = (s.badge || '').toLowerCase().includes(cleanQuery);
      const matchCompetencies = (s.competencies || []).some((c) =>
        c.toLowerCase().includes(cleanQuery)
      );
      return matchName || matchDesc || matchCategory || matchBadge || matchCompetencies;
    });
  }

  return filtered;
}

