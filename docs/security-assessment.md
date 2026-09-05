# HYRD Security Assessment

Date: 2026-09-04

Scope: HYRD monorepo current working tree, including Sprint 9 Part 1 cookie-auth security hardening. This assessment reviewed implementation and tests for `apps/api`, `apps/web`, CI, environment examples, and dependency metadata. It did not perform active external testing, ZAP scanning, deployment testing, dependency upgrades, or remediation.

Frameworks:

- OWASP ASVS 5.0, Level 1 target
- OWASP Top 10:2025
- OWASP API Security Top 10:2023

## A. Executive Summary

HYRD has a solid baseline for an early production-readiness stage. The application now uses HTTP-only cookie sessions, session-bound signed CSRF tokens for unsafe requests, Origin validation, restricted credentialed CORS, Helmet, strict Zod request validation, Prisma query construction, ownership-scoped application queries, security-conscious logging redaction, and CI coverage for web and API workspaces.

The highest-priority confirmed risk is supply-chain exposure reported by `npm audit`: high-severity vulnerabilities exist in transitive Prisma CLI dependencies. The most important remaining application security improvements are defense-in-depth items around distributed rate limiting and production infrastructure hardening.

This review found no confirmed broken object-level authorization in the application CRUD implementation. Application list, stats, retrieve, update, and delete paths are scoped by authenticated `userId`.

Finding counts:

- Critical: 0
- High: 1
- Medium: 4
- Low: 4
- Informational: 3

## B. Scope And Methodology

Reviewed files included:

- API startup and middleware: `apps/api/src/app.ts`, `apps/api/src/server.ts`
- Environment and logging: `apps/api/src/config/env.ts`, `apps/api/src/config/logger.ts`
- Authentication and sessions: `apps/api/src/modules/auth/*`
- CSRF, Origin, and rate limiting: `apps/api/src/middleware/*`
- Application authorization and validation: `apps/api/src/modules/applications/*`
- Frontend API/auth handling: `apps/web/src/lib/api-client.ts`, `apps/web/src/auth/*`
- Frontend rendering/storage indicators: `apps/web/src`
- CI: `.github/workflows/ci.yml`
- Env examples: `apps/api/.env.example`, `apps/api/.env.test.example`, `apps/web/.env.example`
- Dependency metadata: `package.json`, workspace `package.json` files, `package-lock.json`

Commands run:

- `npm audit --workspaces --audit-level=low`

No files were changed during evidence gathering except this report file.

## C. Architecture And Trust Boundaries

HYRD is an npm monorepo with:

- `apps/web`: React/Vite SPA using TanStack Query and a shared fetch client.
- `apps/api`: Express API using Prisma and PostgreSQL.
- Browser authentication: HTTP-only `hyrd_session` cookie.
- CSRF: signed double-submit token issued by `GET /api/auth/csrf`, returned in JSON, and mirrored in host-only `hyrd_csrf` cookie. Guest tokens support login and registration; authenticated tokens are bound to the current session cookie with a one-way HMAC.
- Trust boundary 1: browser to static web host.
- Trust boundary 2: browser to API origin using credentialed CORS.
- Trust boundary 3: API to PostgreSQL via Prisma.
- Trust boundary 4: CI and deployment supply chain.

Cross-origin cookie implications:

- `credentials: "include"` is required by the frontend for session cookies.
- API CORS allows only `CLIENT_ORIGIN` and `credentials: true`.
- In production, session and CSRF cookies become `Secure`.
- `COOKIE_SAME_SITE=none` supports cross-site frontend/API domains, but requires HTTPS and CSRF protection.
- CORS does not prevent CSRF by itself; CSRF tokens and Origin checks protect unsafe browser requests.

## D. Findings

### HYRD-SEC-001: Vulnerable Transitive Dependencies Reported By npm Audit

- Severity: High
- Affected component/file: `package-lock.json`, Prisma transitive dependency graph
- OWASP Top 10: A03:2025 Software Supply Chain Failures
- OWASP API Top 10: API8:2023 Security Misconfiguration
- ASVS 5.0: V14 Configuration, dependency, and build security
- Status: Open
- Evidence: Initial `npm audit --workspaces --audit-level=low` reported 5 vulnerabilities: high issues in `deepmerge-ts@7.1.5` and `mysql2@3.15.3` through `prisma@7.10.0`, and moderate issues in `qs@6.15.3`. Sprint 9 Part 3A triage found these paths:
  - `@hyrd/api` -> `prisma@7.10.0` -> `@prisma/config@7.10.0` -> `deepmerge-ts@7.1.5`
  - `@hyrd/api` -> `prisma@7.10.0` -> `mysql2@3.15.3`
  - `@hyrd/api` -> `express@5.2.1` and `body-parser@2.3.0` -> `qs@6.15.3`; `supertest@7.2.2` -> `superagent@10.3.0` also used the deduped `qs`
- Remediation recorded: `qs` was updated from `6.15.3` to patched `6.16.0` through `npm update qs`. This changed only `package-lock.json` and stayed within Express/body-parser/Superagent compatible semver ranges. Final `npm audit` no longer reports the `qs` advisory.
- Remaining evidence: final `npm audit --workspaces --audit-level=low` and `npm audit --workspaces --omit=dev --audit-level=low` still report 4 high vulnerabilities through Prisma's transitive `deepmerge-ts` and `mysql2` dependencies. `npm audit fix --dry-run` indicates the available automated remediation requires `npm audit fix --force` and would install `prisma@6.19.3`, a breaking version change from the current `7.10.0` stack.
- Exposure assessment: `qs` was in the production API dependency path through Express and is now remediated. `deepmerge-ts` and `mysql2` are introduced by the Prisma CLI/package graph. HYRD source, Prisma schema, adapter configuration, generated client usage, tests, and package metadata use PostgreSQL via `@prisma/adapter-pg`; no HYRD source imports `mysql2` or executes MySQL database operations. Practical runtime exposure to the `mysql2` advisories is therefore lower, but npm still reports the package in the production install tree. `deepmerge-ts` is used by Prisma configuration tooling and remains a build/deployment tooling exposure.
- Realistic attack scenario: A vulnerable transitive package is used in a reachable production, deployment, or build-time path and an attacker triggers denial of service or credential exposure behavior. The Prisma-related `mysql2` finding is likely lower practical exposure for HYRD because HYRD uses PostgreSQL, but it remains a confirmed supply-chain finding.
- Recommended remediation: Track Prisma's supported releases and update Prisma, `@prisma/client`, and `@prisma/adapter-pg` together when a compatible non-breaking patched path exists. Do not use `npm audit fix --force` or downgrade/major-change Prisma without validating generated client behavior, migrations, and deployment commands.
- Verification method: Re-run `npm audit --workspaces --audit-level=low`; run full web/API CI after dependency changes.

### HYRD-SEC-002: CSRF Token Is Not Bound To The Authenticated Session

- Severity: Medium
- Affected component/file: `apps/api/src/middleware/csrf.ts`
- OWASP Top 10: A06:2025 Insecure Design
- OWASP API Top 10: API2:2023 Broken Authentication
- ASVS 5.0: V3 Session Management, V4 Access Control
- Status: Mitigated
- Evidence: Sprint 9 Part 3C added session-bound CSRF tokens. Logged-out users receive signed guest tokens for login and registration. Authenticated CSRF tokens include a signed payload with a one-way HMAC binding derived from the current session cookie value, without exposing the raw session token. Login and registration clear the guest CSRF cookie, causing the frontend to bootstrap a new session-bound token before the next unsafe request.
- Realistic attack scenario: Previously, a valid CSRF token was not tied to a session. That cross-session reuse scenario is now covered by tests that reject Session A tokens when used with Session B and reject stale pre-login guest tokens for authenticated application mutations.
- Recommended remediation: Complete. Continue to protect `CSRF_SECRET` and rotate it only with a planned session/token invalidation strategy.
- Verification method: Automated tests cover guest bootstrap, guest login/registration, stale guest rejection after authentication, cross-session rejection, authenticated mutation success, logout binding, cookie clearing, and malformed/tampered token failures.

### HYRD-SEC-003: Rate Limiting Is In-Memory And Not Deployment-Distributed

- Severity: Medium
- Affected component/file: `apps/api/src/middleware/rate-limit.ts`
- OWASP Top 10: A06:2025 Insecure Design
- OWASP API Top 10: API4:2023 Unrestricted Resource Consumption, API6:2023 Unrestricted Access to Sensitive Business Flows
- ASVS 5.0: V2 Authentication, V11 Business Logic
- Status: Open
- Evidence: Rate-limit buckets are stored in a process-local `Map`.
- Realistic attack scenario: In multi-instance deployments, an attacker spreads login attempts across instances or resets counters by causing restarts. The limiter also loses state on deploy/restart.
- Recommended remediation: Use a deployment-appropriate shared store such as Redis or the hosting provider's edge/WAF rate limiting. Keep local in-memory limits for development and tests.
- Verification method: Dynamic test through the production/staging ingress showing limits are enforced across instances and source IPs are derived correctly through `TRUST_PROXY`.

### HYRD-SEC-004: Swagger Documentation Exposed In All Environments

- Severity: Medium
- Affected component/file: `apps/api/src/app.ts`
- OWASP Top 10: A02:2025 Security Misconfiguration
- OWASP API Top 10: API9:2023 Improper Inventory Management
- ASVS 5.0: V14 Configuration
- Status: Mitigated
- Evidence: Sprint 9 Part 3B added `ENABLE_API_DOCS`, defaulting documentation to enabled outside production and disabled in production. `/api/docs` and `/api/docs.json` are mounted only when documentation is enabled; when disabled, both endpoints fall through to the normal `Route not found` 404 response.
- Realistic attack scenario: Attackers use complete endpoint schemas and examples to speed up enumeration, fuzzing, and abuse against a public API.
- Recommended remediation: Complete. Continue to keep production documentation exposure intentional.
- Verification method: Automated tests cover enabled docs, disabled docs, production default disabled behavior, and invalid `ENABLE_API_DOCS` validation.

### HYRD-SEC-005: Health Endpoint Does Not Prove Database Readiness

- Severity: Medium
- Affected component/file: `apps/api/src/app.ts`
- OWASP Top 10: A10:2025 Mishandling of Exceptional Conditions
- OWASP API Top 10: API8:2023 Security Misconfiguration
- ASVS 5.0: V14 Configuration, V12 API and Web Service
- Status: Mitigated
- Evidence: Sprint 9 Part 3B kept `/api/health` as a static liveness check and added unauthenticated `/api/ready`, which performs a minimal Prisma `SELECT 1` connectivity check. Successful checks return `status: "ready"` with `database: "available"`; failed checks log the underlying error and return a sanitized 503 response with `database: "unavailable"`.
- Realistic attack scenario: A load balancer routes traffic to an API instance whose process is alive but database access is broken, causing user-facing failures.
- Recommended remediation: Complete for application-level readiness. A future deployment can add platform-level timeout tuning if needed.
- Verification method: Automated tests cover liveness without database checks, readiness success, and readiness failure.

### HYRD-SEC-006: Password Hashing Uses scrypt Defaults Without Explicit Cost Parameters

- Severity: Low
- Affected component/file: `apps/api/src/modules/auth/password.ts`
- OWASP Top 10: A04:2025 Cryptographic Failures, A07:2025 Authentication Failures
- OWASP API Top 10: API2:2023 Broken Authentication
- ASVS 5.0: V2 Authentication, V6 Cryptography
- Status: Open
- Evidence: Password hashing uses Node `scrypt` with random 16-byte salt and 64-byte key, but does not persist explicit cost parameters with the hash.
- Realistic attack scenario: Future runtime default changes or scaling requirements make it hard to tune work factors or migrate old hashes predictably.
- Recommended remediation: Store algorithm and parameters in the password hash format, or migrate to a well-maintained password-hashing package with explicit parameters.
- Verification method: Unit tests for hash parsing, verification, invalid formats, and migration compatibility.

### HYRD-SEC-007: User Enumeration Possible On Registration

- Severity: Low
- Affected component/file: `apps/api/src/modules/auth/auth.service.ts`
- OWASP Top 10: A07:2025 Authentication Failures
- OWASP API Top 10: API2:2023 Broken Authentication
- ASVS 5.0: V2 Authentication
- Status: Open
- Evidence: duplicate registration returns `EMAIL_ALREADY_REGISTERED`.
- Realistic attack scenario: An attacker submits email addresses to registration and distinguishes existing accounts from new ones.
- Recommended remediation: For public production, consider a generic registration response or email verification flow. This is lower risk for a personal tracker but should be an explicit product decision.
- Verification method: Abuse test registration responses and timing.

### HYRD-SEC-008: No Account Lockout Or Progressive Delay Beyond IP-Based Rate Limit

- Severity: Low
- Affected component/file: `apps/api/src/modules/auth/auth.routes.ts`, `apps/api/src/middleware/rate-limit.ts`
- OWASP Top 10: A07:2025 Authentication Failures
- OWASP API Top 10: API2:2023 Broken Authentication, API6:2023 Unrestricted Access to Sensitive Business Flows
- ASVS 5.0: V2 Authentication
- Status: Open
- Evidence: login/register have IP-based rate limits, but no account-targeted throttling or progressive delay.
- Realistic attack scenario: A distributed attacker rotates IPs to continue password guessing against a known email.
- Recommended remediation: Add account/email-keyed throttling with careful generic responses, plus optional progressive delays.
- Verification method: Tests for repeated failures against the same normalized email across multiple IPs.

### HYRD-SEC-009: Production Database TLS Requirement Is Not Documented Or Enforced

- Severity: Low
- Affected component/file: `apps/api/src/config/env.ts`, deployment docs
- OWASP Top 10: A04:2025 Cryptographic Failures, A02:2025 Security Misconfiguration
- OWASP API Top 10: API8:2023 Security Misconfiguration
- ASVS 5.0: V6 Cryptography, V14 Configuration
- Status: Open
- Evidence: `DATABASE_URL` is required, but production TLS expectations are not validated or documented.
- Realistic attack scenario: A production deployment accidentally connects to PostgreSQL without TLS across an untrusted network.
- Recommended remediation: Document provider-specific TLS requirements and optionally validate production `DATABASE_URL` parameters.
- Verification method: Deployment smoke test confirms encrypted DB transport according to provider tooling.

### HYRD-SEC-010: Security Event Logging And Alerting Are Minimal

- Severity: Informational
- Affected component/file: `apps/api/src/config/logger.ts`, auth/security middleware
- OWASP Top 10: A09:2025 Security Logging & Alerting Failures
- OWASP API Top 10: API10:2023 Unsafe Consumption of APIs is not directly applicable; operational API monitoring applies
- ASVS 5.0: V14 Configuration
- Status: Open
- Evidence: Pino HTTP logging redacts cookies and authorization headers, but no explicit security-event logging or alerting exists for CSRF failures, Origin rejects, or rate-limit events.
- Realistic attack scenario: Repeated CSRF or brute-force probes occur without actionable operational visibility.
- Recommended remediation: Add structured security event logs and deployment alerts for unusual authentication, CSRF, Origin, and rate-limit activity.
- Verification method: Trigger local security events and verify sanitized logs/metrics.

### HYRD-SEC-011: CI Actions Are Versioned But Not Pinned To Immutable SHAs

- Severity: Informational
- Affected component/file: `.github/workflows/ci.yml`
- OWASP Top 10: A03:2025 Software Supply Chain Failures, A08:2025 Software or Data Integrity Failures
- OWASP API Top 10: API8:2023 Security Misconfiguration
- ASVS 5.0: V14 Configuration
- Status: Open
- Evidence: CI uses `actions/checkout@v6` and `actions/setup-node@v7`, with least-privilege `contents: read`.
- Realistic attack scenario: A compromised or retagged action version affects CI execution.
- Recommended remediation: Pin third-party GitHub Actions to commit SHAs and use dependency review where appropriate.
- Verification method: CI workflow references immutable SHAs and continues to pass.

### HYRD-SEC-012: Production Source Map Policy Not Explicit

- Severity: Informational
- Affected component/file: `apps/web/vite.config.ts`
- OWASP Top 10: A02:2025 Security Misconfiguration
- OWASP API Top 10: Not applicable
- ASVS 5.0: V14 Configuration
- Status: Open
- Evidence: Vite config does not enable production sourcemaps, so default behavior is acceptable. The production policy is not documented.
- Realistic attack scenario: Future config enables public source maps unintentionally, exposing implementation details.
- Recommended remediation: Document source map policy or set `build.sourcemap` explicitly.
- Verification method: Inspect production build artifacts for `.map` files.

## E. OWASP Top 10:2025 Coverage Matrix

| Category | Current coverage | Status |
| --- | --- | --- |
| A01 Broken Access Control | Application ownership scoped by `userId`; protected routes use `requireAuthentication`. | Pass for reviewed CRUD paths |
| A02 Security Misconfiguration | Helmet, CORS, env validation exist; Swagger and DB readiness need production hardening. | Partial |
| A03 Software Supply Chain Failures | Lockfile exists and CI uses `npm ci`; audit has open findings; actions not SHA-pinned. | Fail |
| A04 Cryptographic Failures | HTTP-only secure cookies in production; random session tokens; scrypt passwords; DB TLS not documented. | Partial |
| A05 Injection | Prisma query APIs, Zod validation, no command execution in request paths found. | Pass for reviewed paths |
| A06 Insecure Design | CSRF/rate limits added; rate limit store and CSRF session binding need hardening. | Partial |
| A07 Authentication Failures | Generic login errors, session revocation, rate limits; registration enumeration remains. | Partial |
| A08 Software/Data Integrity Failures | CI exists; no deployment artifact signing or action SHA pinning. | Partial |
| A09 Logging & Alerting Failures | Logs redact cookies; no explicit alerting/security event handling. | Partial |
| A10 Mishandling Exceptional Conditions | Generic 500s and JSON errors; readiness still static. | Partial |

## F. OWASP API Security Top 10:2023 Coverage Matrix

| Category | Current coverage | Status |
| --- | --- | --- |
| API1 Broken Object Level Authorization | `id` operations query by `id` and `userId`; tests cover cross-user isolation. | Pass |
| API2 Broken Authentication | Strong random sessions and cookie flags; session CSRF binding/account throttling improvements remain. | Partial |
| API3 Broken Object Property Level Authorization | Response mapper excludes password/session fields; strict schemas reject unknown app fields. | Pass |
| API4 Unrestricted Resource Consumption | JSON body limit, pagination max, rate limits; in-memory limiter remains. | Partial |
| API5 Broken Function Level Authorization | Application routes require authentication; no admin functions currently. | Pass |
| API6 Unrestricted Access to Sensitive Business Flows | Auth rate limit exists; distributed/account limits absent. | Partial |
| API7 SSRF | No server-side outbound fetch of user URLs found. Job URLs are stored, not fetched. | Not Applicable |
| API8 Security Misconfiguration | CORS/Helmet/env validation exist; Swagger/readiness/DB TLS need production controls. | Partial |
| API9 Improper Inventory Management | OpenAPI docs exist but public; endpoint inventory appears current. | Partial |
| API10 Unsafe Consumption of APIs | No third-party API consumption found. | Not Applicable |

## G. ASVS 5.0 Level 1 Checklist

| Area | Result | Evidence |
| --- | --- | --- |
| V1 Architecture | Partial | Trust boundaries are implicit; no formal threat model in repo. |
| V2 Authentication | Partial | Scrypt hashing, generic login errors, sessions, rate limit; registration enumeration and no account throttling. |
| V3 Session Management | Partial | Random tokens, hashed storage, expiry, logout deletion, HTTP-only cookie; CSRF not bound to session. |
| V4 Access Control | Pass | CRUD operations enforce `userId`; tests cover isolation. |
| V5 Validation/Sanitization | Pass | Strict Zod schemas, UUID/pagination validation, React escaping, no dangerous HTML found. |
| V6 Cryptography | Partial | Good local crypto primitives; DB TLS and password cost metadata not explicit. |
| V7 Error Handling/Logging | Partial | Generic 500 and redaction; security alerting absent. |
| V8 Data Protection | Partial | Password/session secrets excluded from API responses; deployment TLS controls not fully documented. |
| V9 Communications | Not Verified | HTTPS is deployment/platform dependent and not testable locally from code. |
| V10 Malicious Code | Partial | Lockfile/CI exist; audit findings open. |
| V11 Business Logic | Partial | Basic validation/rate limits; abuse testing limited. |
| V12 API/Web Service | Partial | API inventory and validation exist; public docs and readiness gap remain. |
| V13 Configuration | Partial | Env validation exists; production hardening remains. |
| V14 Security Configuration | Partial | CI and logging exist; action pinning and alerting remain. |

## H. Dependency Audit Results

Command:

```bash
npm audit --workspaces --audit-level=low
```

Current result after Sprint 9 Part 3A: failed with 4 high vulnerabilities.

- High: `deepmerge-ts <8.0.0`, via `@prisma/config` and `prisma`
- High: `mysql2 <=3.23.0`, via `prisma`

Notes:

- `qs` was updated from `6.15.3` to `6.16.0`; the moderate `qs` advisory is no longer reported.
- `npm audit fix --force` proposed a breaking Prisma downgrade/change path and was not run.
- HYRD uses PostgreSQL, so the `mysql2` runtime exploitability may be limited, but it remains a confirmed vulnerable transitive package in the dependency tree.
- No Prisma dependency upgrades were performed because no safe non-forced compatible patch path was identified.

## I. Recommended Remediation Order

1. Resolve `npm audit` findings through compatible dependency updates, avoiding forced breaking changes.
2. Gate or protect Swagger docs in production.
3. Add DB-backed readiness endpoint separate from liveness.
4. Replace or augment in-memory rate limits with shared/edge limits for production.
5. Add account/email-keyed authentication throttling with generic responses.
6. Document and verify production database TLS.
7. Add structured security event logging and alerting.
8. Pin GitHub Actions to immutable SHAs.
9. Make production source map policy explicit.

## J. Residual Risks And Testing Limitations

- This was code review plus local command assessment, not a penetration test.
- No ZAP scan was run.
- No external systems were attacked or scanned.
- Production HTTPS, proxy behavior, cookie delivery, CORS behavior, database TLS, and distributed rate limiting must be verified in staging or production-like infrastructure.
- Automated tests prove selected expected behavior; they do not prove complete security.
- ASVS mappings are limited to controls that could be assessed from available code and tests.
