# Fullstack Web Security, Authentication, and Authorization

## Authentication Architecture
- JSON Web Tokens (JWT) vs Stateful Sessions:
  - Access Tokens (short-lived, 15m) and Refresh Tokens (long-lived, stored in HttpOnly, SameSite=Strict cookies with rotation).
  - Stateful session stores (Redis) with token revocation vs stateless cryptographically signed claims.
- OAuth 2.0 & OpenID Connect (OIDC):
  - Authorization Code Flow with PKCE (Proof Key for Code Exchange) for public client single-page applications.
  - Multi-Factor Authentication (MFA / TOTP) and biometric WebAuthn / Passkeys.

## Authorization & Access Control
- Role-Based Access Control (RBAC): assigning roles (Admin, Editor, Viewer) to users with fixed permission sets.
- Attribute-Based Access Control (ABAC): dynamic access policies evaluating user attributes, resource tenant IDs, and context (IP, time).
- Row-Level Security (RLS): database-enforced multi-tenant isolation ensuring users cannot query other tenants' records.

## Common Security Vulnerabilities & Mitigations (OWASP Top 10)
- Cross-Site Scripting (XSS): DOM-based, stored, and reflected XSS. Sanitization, Content Security Policy (CSP), avoiding raw HTML injections.
- Cross-Site Request Forgery (CSRF): anti-CSRF tokens, SameSite cookies, custom request headers.
- SQL / NoSQL Injection: parameterized queries, prepared statements, ORM query builders.
- Secure HTTP Headers: Strict-Transport-Security (HSTS), X-Frame-Options, X-Content-Type-Options.
