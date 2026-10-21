# Fullstack Architecture and Data Systems

## Fullstack Architectural Patterns
- Monolith vs Microservices: understanding when to build modular monoliths with domain boundaries versus decomposing into event-driven microservices.
- Layered Architecture: Clean / Onion Architecture; decoupling Controllers (API entry), Services (business logic), and Repositories (database persistence).
- Backend-For-Frontend (BFF): tailoring backend aggregation endpoints specifically for web, mobile, or third-party client constraints.

## Relational and NoSQL Database Design
- Schema Design & Normalization: 1NF to 3NF, primary and foreign key constraints, foreign key cascading, and selective denormalization for read performance.
- Relational (PostgreSQL, MySQL): ACID transactions, transaction isolation levels (Read Committed, Serializable), connection pooling (PgBouncer), and indexing strategies (B-tree, GIN).
- Document & Key-Value (MongoDB, Redis): flexible schema documents, embedding vs referencing documents, caching layers, write-through vs cache-aside patterns.
- Database Migrations: versioned migrations, zero-downtime schema evolution, expand-contract pattern for column renames and deprecations.
