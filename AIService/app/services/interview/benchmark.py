"""
PrepNova Interview Benchmark & Difficulty Calibration Engine.
Defines a structured, realistic interview rubric across 6 distinct question types:
1. Core Technical Concept & Syntax
2. Practical Implementation / Coding Logic
3. Real-World Debugging & Error Handling
4. Design & Architecture (calibrated to difficulty level)
5. Data Persistence, APIs & Security
6. Real-World Experience, Project Deep-Dive & Trade-offs
"""

from typing import Dict, List, Any


ROLE_TOPIC_TREES: Dict[str, List[str]] = {
    "Frontend Engineer": [
        "JavaScript Core, Event Loop & Closures",
        "React Component Lifecycle, Hooks & Virtual DOM",
        "DOM Performance, Core Web Vitals & Bundle Splitting",
        "Client State Management & Data Caching (Zustand/RTK/React Query)",
        "Browser Security (XSS, CSRF, CSP, CORS) & Storage APIs",
        "Hands-on Project Implementation & Engineering Trade-offs"
    ],
    "Backend Engineer": [
        "Language Concurrency, Memory & Async Event Loop",
        "API Contracts, REST Idempotency & GraphQL Mechanics",
        "Database Indexing, Query Optimization & Transactions",
        "Caching Strategies, Redis TTLs & Resilience",
        "Authentication (JWT/OAuth), Security & System Reliability",
        "Hands-on Project Architecture & Engineering Trade-offs"
    ],
    "Fullstack Engineer": [
        "JavaScript/TypeScript Fullstack Mechanics & Types",
        "Client-Server Data Contracts & Real-time WebSockets",
        "Relational & NoSQL Database Schema Design",
        "State Synchronization & Optimistic UI Updates",
        "End-to-End Web Security, Auth & Deployment",
        "Fullstack Project Lifecycle & Architectural Decisions"
    ],
    "AI Engineer": [
        "Python Internals & Matrix/Tensor Operations",
        "RAG Pipeline Architecture, Chunking & Vector Search",
        "Embedding Models & Vector Similarity Metrics",
        "Agent Workflows, State Graphs & Tool Calling",
        "LLM Evaluation, Grounding & Hallucination Mitigation",
        "Production AI Project Deployment & Latency Optimization"
    ],
    "DevOps Engineer": [
        "Linux OS Internals, Namespaces & Docker Containerization",
        "Kubernetes Pod Scheduling, Services & Ingress",
        "CI/CD Pipeline Automation & GitOps Deployment",
        "Observability (Prometheus Metrics, OpenTelemetry Traces, Logs)",
        "Infrastructure as Code (Terraform) & Cloud Security",
        "Production Incident Post-Mortem & High Availability Strategy"
    ],
    "Data Scientist": [
        "Statistical Foundations, Probability & Linear Algebra",
        "Feature Engineering & Data Preprocessing Pipelines",
        "Supervised & Unsupervised ML Model Architectures",
        "Model Evaluation Metrics (Precision/Recall, ROC-AUC, F1)",
        "SQL Window Functions & Analytical Query Optimization",
        "Production ML Model Monitoring & Data Drift Detection"
    ],
    "Cloud Engineer": [
        "Cloud Virtual Private Cloud (VPC) Networking & Subnet Routing",
        "Compute Architecture, Autoscaling & Load Balancing",
        "Cloud Storage Tiers & Database High Availability",
        "Identity & Access Management (IAM) Least Privilege",
        "Serverless Event-Driven Systems & FinOps Cost Control",
        "Cloud Disaster Recovery & Multi-Region Failover Architecture"
    ],
    "QA Engineer": [
        "Test Automation Pyramid & Strategy (Unit, Integration, E2E)",
        "Modern Headless E2E Automation (Playwright / Cypress)",
        "Automated API Contract & Schema Validation Testing",
        "Performance, Load & Stress Testing (k6 / JMeter)",
        "Defect Lifecycle, Triage & Shift-Left Quality Strategy",
        "Real-World Test Suite Stabilization & Flakiness Reduction"
    ]
}


DIFFICULTY_BENCHMARKS: Dict[str, Dict[str, Any]] = {
    "beginner": {
        "level_title": "Junior / Entry-Level",
        "description": "Foundational technical mechanics, fundamental syntax, basic coding logic, and common error diagnosis. FORBIDDEN: microservices, distributed systems, high concurrency, or complex architectural trade-offs.",
        "rubric": [
            {
                "turn": 1,
                "category": "Technical Concept",
                "format": "Technical Short Answer",
                "type_name": "Core Syntax & Language Mechanics",
                "slot_objective": "core syntax, fundamental primitives, variable scoping, and execution flow",
                "interviewer_intent": "Verify that candidate understands the fundamental building blocks of the language/technology under the hood.",
                "style_instructions": "Ask a direct, concrete question about language/framework mechanics (e.g. scoping, data structures, value vs reference, basic operators, or HTTP methods). Do NOT ask high-level architecture.",
                "realistic_examples": [
                    "In JavaScript, what is the exact difference between '==' and '===', and can you give an example where unexpected type coercion leads to a bug?",
                    "In Python, what is the difference between a list and a tuple, and in what situation would choosing one over the other affect performance or safety?",
                    "In SQL, what is the difference between a WHERE clause and a HAVING clause?"
                ]
            },
            {
                "turn": 2,
                "category": "Practical Implementation",
                "format": "Coding Logic",
                "type_name": "Hands-on Implementation / Coding Logic",
                "slot_objective": "writing clean implementation logic, transforming collections, and handling function inputs",
                "interviewer_intent": "Assess candidate's ability to write realistic, working code to solve a common software task.",
                "style_instructions": "Give a realistic, concrete coding scenario: how to implement a specific function, filter data, validate input, or handle an event. Avoid abstract theory.",
                "realistic_examples": [
                    "Suppose you have an array of user objects and you need to filter out inactive users and extract only their email addresses. How would you write that cleanly?",
                    "How would you implement a basic input validation function for a user signup form before sending data to an API?",
                    "If you need to fetch data from an API endpoint and display a loading spinner while waiting, how would you structure that logic?"
                ]
            },
            {
                "turn": 3,
                "category": "Debugging & Error Handling",
                "format": "Debugging Scenario",
                "type_name": "Practical Debugging & Common Errors",
                "slot_objective": "debugging common runtime exceptions, inspecting errors, and fixing unexpected behavior",
                "interviewer_intent": "Verify that candidate knows how to read stack traces, inspect logs, and systematically debug broken code.",
                "style_instructions": "Present a realistic bug or error message that everyday developers encounter (e.g. undefined property, 404/500 error, CORS issue, unhandled promise rejection) and ask how they diagnose and resolve it.",
                "realistic_examples": [
                    "You open browser devtools and see: 'Uncaught TypeError: Cannot read properties of undefined (reading 'map')'. What usually causes this, and how would you fix it?",
                    "A frontend app tries to call a backend API and fails with a CORS error in the console. What does that mean, and where does the fix need to happen?",
                    "If a backend endpoint returns a 500 Internal Server Error, what exact steps do you take to find out what broke?"
                ]
            },
            {
                "turn": 4,
                "category": "Component / Modular Design",
                "format": "Component Structure",
                "type_name": "Modular Code Organization & Reusability",
                "slot_objective": "organizing code into modular components/functions, props/parameter passing, and clean separation",
                "interviewer_intent": "Check if candidate knows how to structure small features into clean, maintainable, reusable pieces.",
                "style_instructions": "Ask how to break down a small UI screen or utility module into reusable functions or components. Emphasize separation of concerns, NOT distributed systems.",
                "realistic_examples": [
                    "When building a user profile page with a header, avatar, and settings form, how would you decide which parts should be separate components?",
                    "What is the difference between passing data via props and maintaining local state? When would you choose one over the other?",
                    "How do you organize your project folders and helper files so your code stays easy to navigate as the codebase grows?"
                ]
            },
            {
                "turn": 5,
                "category": "Data & Web Fundamentals",
                "format": "Technical Scenario",
                "type_name": "Data Basics, Storage & Web Fundamentals",
                "slot_objective": "basic data persistence, safe input handling, and essential web security hygiene",
                "interviewer_intent": "Verify understanding of web security fundamentals and basic data handling.",
                "style_instructions": "Ask about practical data storage (e.g. localStorage vs cookies, primary keys in SQL) or basic web safety (e.g. preventing SQL injection, sanitizing HTML).",
                "realistic_examples": [
                    "What is the difference between storing data in localStorage versus in an HttpOnly cookie, and which one is safer for auth tokens?",
                    "What is SQL injection, and how does using parameterized queries or prepared statements prevent it?",
                    "What is the difference between HTTP GET and POST requests, and why shouldn't sensitive data be sent in a GET query string?"
                ]
            },
            {
                "turn": 6,
                "category": "Experience & Practical Learning",
                "format": "Behavioral / Project Deep-Dive",
                "type_name": "Project Walkthrough & Problem Solving",
                "slot_objective": "hands-on project walkthrough, personal technical obstacles, and learning methodology",
                "interviewer_intent": "Gauge candidate's real hands-on experience, passion for programming, and how they overcome obstacles.",
                "style_instructions": "Ask about a feature or project from their resume/experience: how they built it, what tools they used, or a memorable bug they personally fixed.",
                "realistic_examples": [
                    "Tell me about a project or feature you built that you are proud of. What was the most challenging technical part for you, and how did you solve it?",
                    "When you get stuck on a difficult programming bug or unfamiliar error, what is your step-by-step process for getting unstuck?",
                    "How do you approach learning a new library or tool that you haven't worked with before?"
                ]
            }
        ]
    },
    "intermediate": {
        "level_title": "Mid-Level Professional",
        "description": "Production implementation, lifecycle mechanics, performance optimization, and robust error resilience. FORBIDDEN: trivial syntax definitions or extreme distributed consensus algorithms.",
        "rubric": [
            {
                "turn": 1,
                "category": "Technical Mechanics & Internals",
                "format": "Technical Short Answer",
                "type_name": "Framework Lifecycle & Runtime Internals",
                "slot_objective": "framework rendering engine, async concurrency mechanics, and internal memory behavior",
                "interviewer_intent": "Verify candidate knows how their chosen framework or language operates under the hood.",
                "style_instructions": "Ask about production-critical mechanics (e.g. render batching, event loop microtasks vs macrotasks, indexing structures, database connection pooling).",
                "realistic_examples": [
                    "In React 18, how does automatic batching work when multiple state updates happen inside an async fetch or setTimeout callback?",
                    "How does database indexing work under the hood (e.g. B-Tree vs Hash index), and why can adding too many indexes slow down write operations?",
                    "In Node.js or Python asyncio, what is the difference between the microtask queue and macrotask queue, and how can a long-running CPU task block the event loop?"
                ]
            },
            {
                "turn": 2,
                "category": "Implementation & Optimization",
                "format": "Coding Scenario",
                "type_name": "Feature Implementation & Performance Tuning",
                "slot_objective": "implementing scalable features, memoization, caching layers, and eliminating bottlenecks",
                "interviewer_intent": "Evaluate candidate's ability to build performant features and prevent production latency issues.",
                "style_instructions": "Give a concrete implementation challenge: optimizing an endpoint, preventing unnecessary re-renders, adding caching, or paginating large datasets.",
                "realistic_examples": [
                    "You have a search input that queries an API on every keystroke. How would you implement debouncing and request cancellation to avoid race conditions?",
                    "Suppose an API endpoint querying 100,000 rows is taking 1.8 seconds. How do you use EXPLAIN ANALYZE to identify the bottleneck, and what strategies would you use to get it under 50ms?",
                    "How would you design a client-side data fetching layer that supports optimistic UI updates with automatic rollback on network failure?"
                ]
            },
            {
                "turn": 3,
                "category": "Debugging & Edge Cases",
                "format": "Debugging Scenario",
                "type_name": "Race Conditions, Memory Leaks & Edge Cases",
                "slot_objective": "debugging subtle production incidents, race conditions, and error resilience patterns",
                "interviewer_intent": "Assess troubleshooting ability when things go wrong in production under real user traffic.",
                "style_instructions": "Describe a subtle production incident (e.g. intermittent API timeout, state mutation race condition, N+1 query problem, stale cache) and ask for their diagnostic approach.",
                "realistic_examples": [
                    "Users report that occasionally after clicking 'Save', their changes revert back 2 seconds later. What kind of state or network race condition causes this, and how do you prevent it?",
                    "Your service's memory usage steadily climbs over 48 hours until Kubernetes restarts the pod with an OOMKilled error. How would you profile and locate the memory leak?",
                    "What is the N+1 query problem in ORMs, how does it hurt database performance, and how do you resolve it using join-fetching or DataLoader patterns?"
                ]
            },
            {
                "turn": 4,
                "category": "Service / Component Architecture",
                "format": "Architecture Scenario",
                "type_name": "Service Design, Component Boundaries & API Contracts",
                "slot_objective": "designing modular subsystems, API contract design, and clean abstraction layers",
                "interviewer_intent": "Check if candidate can design a scalable feature from scratch with clean boundaries.",
                "style_instructions": "Ask candidate to design a realistic production subsystem (e.g. file upload with pre-signed S3 URLs, reusable data table with sorting/filtering, or REST vs GraphQL contracts).",
                "realistic_examples": [
                    "How would you design a secure file upload feature where users can upload 100MB video files directly to cloud storage without overloading the backend application server?",
                    "When designing a RESTful API contract for an e-commerce order system, how do you design endpoints to ensure payment requests are strictly idempotent?",
                    "How do you design a reusable UI component library that supports accessibility (keyboard navigation, ARIA attributes) and dynamic theme switching?"
                ]
            },
            {
                "turn": 5,
                "category": "Security & Data Integrity",
                "format": "Technical Scenario",
                "type_name": "Authentication Lifecycles, RBAC & Transaction Safety",
                "slot_objective": "implementing secure auth flows, role-based access control, and ACID transaction isolation",
                "interviewer_intent": "Ensure candidate builds software that is secure against real-world exploits and preserves data integrity.",
                "style_instructions": "Ask about JWT rotation with refresh tokens, PKCE in OAuth2, database transaction isolation levels, or preventing race condition overselling.",
                "realistic_examples": [
                    "How do you implement secure JWT authentication using short-lived access tokens and refresh token rotation with HttpOnly cookies?",
                    "In an inventory system, two users buy the last remaining item at the exact same millisecond. How do you prevent overselling using database transactions and locking?",
                    "What is Cross-Site Request Forgery (CSRF), and why are SameSite cookie attributes plus custom request headers effective defenses?"
                ]
            },
            {
                "turn": 6,
                "category": "Project Experience & Trade-offs",
                "format": "Behavioral / Engineering Trade-offs",
                "type_name": "Production Trade-offs & Architecture Evolution",
                "slot_objective": "real project trade-offs, evaluating libraries vs custom code, and technical debt management",
                "interviewer_intent": "Assess candidate's pragmatic engineering judgment and how they navigate technical trade-offs on real teams.",
                "style_instructions": "Ask about a technical trade-off they personally navigated on their resume: why they chose a specific technology, how they handled tech debt, or what trade-offs they balanced.",
                "realistic_examples": [
                    "Walk me through a significant technical trade-off you made on a project: what were the competing options, why did you pick your solution, and what were the drawbacks?",
                    "Describe a time you had to refactor a legacy or poorly performing module in production while keeping the application fully available for active users.",
                    "How do you balance writing thorough automated tests and high test coverage against the pressure to ship features rapidly?"
                ]
            }
        ]
    },
    "advanced": {
        "level_title": "Senior / Staff Engineer",
        "description": "High-scale distributed architecture, low-level concurrency, cascading failure resilience, and technical leadership. FORBIDDEN: simple syntax trivia or basic CRUD walkthroughs.",
        "rubric": [
            {
                "turn": 1,
                "category": "Deep Core Internals & Concurrency",
                "format": "Technical Deep Dive",
                "type_name": "Runtime Internals, Memory Layouts & Concurrency",
                "slot_objective": "low-level execution engine, lock contention, memory profiling, and high-throughput thread safety",
                "interviewer_intent": "Probe candidate's mastery of language runtime internals and high-concurrency systems.",
                "style_instructions": "Ask about low-level runtime internals (e.g. GC pause tuning, lock contention, thread safety, event loop starvation under 50k RPS, memory layout).",
                "realistic_examples": [
                    "Under high concurrent traffic, your service experiences sudden latency spikes due to garbage collection pauses. How do you profile GC behavior, reduce allocation churn, and tune memory thresholds?",
                    "How do database engines handle write-ahead logging (WAL) and checkpointing to guarantee durability without stalling in-memory read throughput?",
                    "In a high-concurrency service handling thousands of concurrent requests, how do you identify lock contention and when would you transition from mutexes to lock-free atomic structures?"
                ]
            },
            {
                "turn": 2,
                "category": "Distributed Systems & Scalability",
                "format": "Distributed Systems Scenario",
                "type_name": "Horizontal Scalability, Partitioning & Backpressure",
                "slot_objective": "data partitioning, sharding, distributed message queues, and backpressure management",
                "interviewer_intent": "Evaluate candidate's ability to scale systems from thousands to millions of requests reliably.",
                "style_instructions": "Present a high-throughput scalability challenge (e.g. database sharding with cross-shard queries, Kafka consumer group rebalancing, rate limiting across clusters).",
                "realistic_examples": [
                    "Suppose you need to scale a relational database beyond a single primary node. Walk me through your sharding strategy: how do you choose a shard key, handle cross-shard transactions, and rebalance shards?",
                    "How do you design a distributed event ingestion pipeline processing 100,000 events/sec that guarantees at-least-once delivery while managing consumer lag and backpressure?",
                    "How would you design a distributed rate-limiting system that accurately enforces per-tenant quotas across 50 globally distributed API gateway nodes without introducing a central Redis latency bottleneck?"
                ]
            },
            {
                "turn": 3,
                "category": "Failure Modes & Disaster Recovery",
                "format": "Chaos & Incident Scenario",
                "type_name": "Cascading Failures, Thundering Herds & Resilience",
                "slot_objective": "debugging cascading service failures, split-brain scenarios, thundering herd mitigation, and fault isolation",
                "interviewer_intent": "Assess how candidate builds self-healing architectures that survive partial cloud outages.",
                "style_instructions": "Describe a catastrophic failure scenario (e.g. cache stampede on viral post, downstream dependency outage causing connection exhaustion, network partition) and ask for resilience architecture.",
                "realistic_examples": [
                    "A critical Redis cache cluster hosting hot product records suddenly crashes, causing millions of requests to hammer the primary database simultaneously. How do you design cache stampede / thundering herd protection?",
                    "A downstream third-party payment vendor starts responding with 15-second timeouts instead of failing immediately, exhausting all HTTP worker threads in your service. How do you implement circuit breakers and bulkhead isolation to prevent complete outage?",
                    "During a cross-region network partition, how do you prevent split-brain state in a distributed database cluster, and what are the trade-offs between consistency and availability in your failover plan?"
                ]
            },
            {
                "turn": 4,
                "category": "System Design & Architecture",
                "format": "System Design",
                "type_name": "End-to-End System Design & High Availability",
                "slot_objective": "end-to-end distributed system design, multi-region architecture, and asynchronous event streaming",
                "interviewer_intent": "Conduct an in-depth senior system design interview: assess component trade-offs, capacity planning, and API contracts.",
                "style_instructions": "Ask candidate to architect a complete distributed system from scratch (e.g. real-time collaborative doc editing, global notification platform, distributed task scheduler).",
                "realistic_examples": [
                    "Design a globally distributed notification service (handling Push, SMS, and Email) supporting priority queues, per-user rate limits, delivery deduplication, and guaranteed delivery status tracking.",
                    "Design a real-time collaborative document editing service (like Google Docs). How do you handle concurrent character edits: Operational Transformation (OT) versus Conflict-free Replicated Data Types (CRDTs)?",
                    "Design an end-to-end analytics platform that ingests clickstream events from mobile and web, aggregates metrics in real-time, and allows sub-second dashboard querying over billions of records."
                ]
            },
            {
                "turn": 5,
                "category": "Data Consistency & Security Governance",
                "format": "Technical Scenario",
                "type_name": "Distributed Consistency, Consensus & Enterprise Security",
                "slot_objective": "distributed consensus (Raft/Paxos), Saga pattern vs 2PC, CQRS, and zero-trust security",
                "interviewer_intent": "Probe deep knowledge of distributed transaction orchestration and enterprise security architectures.",
                "style_instructions": "Dive into distributed transactions across microservices (Saga orchestrator vs choreography, outbox pattern), event sourcing/CQRS, or zero-trust mTLS infrastructure.",
                "realistic_examples": [
                    "In a microservices architecture spanning order, inventory, and billing services, why is Two-Phase Commit (2PC) usually avoided in production, and how do you implement a Saga pattern with compensating transactions and transactional outbox?",
                    "When implementing Command Query Responsibility Segregation (CQRS) with Event Sourcing, how do you handle read-model projection lag and schema evolution over millions of historical events?",
                    "How do you design a zero-trust multi-tenant architecture where client data is isolated using cryptographic envelope encryption and database Row-Level Security (RLS) policies?"
                ]
            },
            {
                "turn": 6,
                "category": "Leadership & Production War Stories",
                "format": "Behavioral / Strategic Decision",
                "type_name": "Production Outage Post-Mortems & Architectural Evolution",
                "slot_objective": "leading complex zero-downtime migrations, blameless post-mortems, and technical strategy",
                "interviewer_intent": "Evaluate engineering maturity, leadership during high-stakes outages, and long-term technical vision.",
                "style_instructions": "Ask candidate to dissect a severe production outage they mitigated or an architectural migration they spearheaded (e.g. monolith to event-driven, zero-downtime DB migration with live traffic).",
                "realistic_examples": [
                    "Walk me through the most severe production outage you personally investigated: what was the root cause, what did the telemetry reveal, how did you stabilize the system, and what systemic changes did you implement to ensure it never happens again?",
                    "Describe a major architectural migration you led (e.g. decomposing a monolith or migrating live production databases). How did you guarantee zero downtime, manage rollback plans, and align engineering stakeholders?",
                    "How do you establish engineering standards, mentor junior and mid-level engineers on system reliability, and decide when to pay down technical debt versus accelerating product delivery?"
                ]
            }
        ]
    }
}


def normalize_level_key(level: str) -> str:
    lvl = (level or "beginner").strip().lower()
    if lvl in ["senior", "advanced", "expert", "hard"]:
        return "advanced"
    if lvl in ["mid", "intermediate", "medium"]:
        return "intermediate"
    return "beginner"


def get_benchmark_slot(difficulty: str, turn_index: int) -> Dict[str, Any]:
    lvl_key = normalize_level_key(difficulty)
    benchmark_data = DIFFICULTY_BENCHMARKS.get(lvl_key, DIFFICULTY_BENCHMARKS["beginner"])
    rubric = benchmark_data["rubric"]
    slot_idx = (max(1, turn_index) - 1) % len(rubric)
    return rubric[slot_idx]


def get_role_default_topics(role: str) -> List[str]:
    for r_name, topics in ROLE_TOPIC_TREES.items():
        if r_name.lower() in role.lower() or role.lower() in r_name.lower():
            return topics
    return ROLE_TOPIC_TREES["Backend Engineer"]


def get_calibrated_fallback_question(difficulty: str, turn_index: int, focus_topic: str, role: str) -> str:
    lvl_key = normalize_level_key(difficulty)
    topic = focus_topic or "core software engineering fundamentals"
    turn = ((max(1, turn_index) - 1) % 6) + 1

    if lvl_key == "beginner":
        templates = {
            1: f"In {topic}, explain how the core syntax and execution flow work under the hood, and what common pitfall beginners should watch out for.",
            2: f"Walk me through how you would write a clean function or routine in {topic} to validate and process incoming data before passing it to downstream components.",
            3: f"What is a common runtime error or unexpected bug you have encountered when developing with {topic}, and what step-by-step approach do you use to diagnose and fix it?",
            4: f"When structuring a feature or module in {topic}, how do you organize your code into maintainable, reusable components or functions?",
            5: f"How do you handle input validation, sensitive parameters, and error states when working with {topic} to ensure reliability and basic security?",
            6: f"Describe a project or technical task where you used {topic}. What was the most challenging part of the implementation, and how did you verify that your solution worked?"
        }
        return templates.get(turn, f"Explain the core mechanics and practical use cases of {topic} in modern software development.")

    elif lvl_key == "intermediate":
        templates = {
            1: f"How does {topic} manage state, memory, or lifecycle execution internally, and how does that influence performance in a production application?",
            2: f"Walk me through how you handle asynchronous operations, error handling, and API integration when building production features with {topic}.",
            3: f"Suppose a service utilizing {topic} suddenly experiences unexpected latency spikes or high memory utilization. What metrics and profiling tools do you use to locate the root cause?",
            4: f"How do you design the boundaries between data persistence, business logic, and presentation when implementing {topic} in a scalable architecture?",
            5: f"What security vulnerabilities or performance bottlenecks are most prevalent when scaling {topic}, and what concrete defensive patterns do you put in place?",
            6: f"Tell me about a technical trade-off you had to navigate while building with {topic}. What alternative approaches did you consider and why did you settle on your chosen path?"
        }
        return templates.get(turn, f"When implementing {topic} in a production environment, how do you handle performance bottlenecks, error resilience, and state trade-offs?")

    else:  # advanced
        templates = {
            1: f"At high concurrency and throughput, what are the primary low-level bottlenecks in {topic} (such as lock contention, memory allocation, or event loop starvation), and how do you profile and optimize them?",
            2: f"When designing a distributed service that leverages {topic}, how do you approach data partitioning, message ordering, and backpressure management under heavy load?",
            3: f"How do you architect resilient failover and disaster recovery around {topic} during network partitions or cascading downstream outages?",
            4: f"Walk me through the end-to-end system design for a high-availability platform built with {topic}, focusing on caching strategies, API gateways, and horizontal scaling limits.",
            5: f"In a multi-region deployment of {topic}, how do you balance strong versus eventual consistency, and how do you handle conflict resolution?",
            6: f"Describe a complex architecture migration or refactor involving {topic}. How did you ensure zero downtime and manage data integrity throughout the transition?"
        }
        return templates.get(turn, f"In a high-throughput, distributed deployment of {topic}, how do you architect the system to handle cascading failures, data consistency, and zero-downtime scaling?")
