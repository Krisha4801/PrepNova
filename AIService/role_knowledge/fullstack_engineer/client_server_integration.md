# Fullstack Client-Server Integration and API Contracts

## API Protocols and Communication Patterns
Fullstack engineers bridge frontend user interfaces and backend distributed services:
1. RESTful APIs: resource-oriented design, proper HTTP verbs (GET, POST, PUT, PATCH, DELETE), idempotent endpoints, status codes, and HATEOAS.
2. GraphQL: client-specified data querying, schema-first development, resolving over-fetching and under-fetching, query batching, and DataLoader pattern to avoid N+1 query problems.
3. WebSockets & Server-Sent Events (SSE): real-time duplex channels for chat, live status updates, and push notifications.
4. gRPC / Protocol Buffers: binary serialization for high-performance microservice internal communications.

## End-to-End Type Safety
- Sharing types across client and server: TypeScript monorepo architectures, tRPC, OpenAPI code generation, or GraphQL Code Generator.
- Schema Validation: validating runtime inputs at API boundaries using Zod, Yup, or Pydantic before business logic execution.
- Error Handling Contract: standardizing RFC 7807 Problem Details JSON format across all service failures.
