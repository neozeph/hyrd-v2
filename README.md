# Hyrd

[![CI](https://github.com/neozeph/hyrd-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/neozeph/hyrd-v2/actions/workflows/ci.yml)

Hyrd is a personal job-application tracker for organizing opportunities, monitoring application progress, and preparing for interviews.

The project is currently focused on building a production-style TypeScript REST API before introducing the React frontend.

## Current Features

- Create, retrieve, update, and delete job applications
- Search by company or position
- Filter applications by status
- Sort application results
- Paginate application results
- PostgreSQL persistence
- Runtime validation with Zod
- Interactive OpenAPI documentation
- Structured HTTP logging
- Security headers and controlled CORS
- Separate development and test databases
- Automated integration tests
- GitHub Actions continuous integration

## Technology

### Backend

- Node.js
- Express
- TypeScript
- Zod
- Prisma ORM
- PostgreSQL
- Pino
- Swagger UI

### Testing and Quality

- Vitest
- Supertest
- GitHub Actions
- TypeScript strict mode

### Planned Frontend

- React
- Vite
- TypeScript
- TanStack Query
- React Hook Form
- Tailwind CSS

## Architecture

The API follows a layered architecture:

```text
HTTP Request
    ↓
Route
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

Application module responsibilities:

```text
application.routes.ts       HTTP route definitions
application.controller.ts   Request and response handling
application.service.ts      Business logic
application.repository.ts   Database operations
application.schema.ts       Runtime validation
application.types.ts        TypeScript contracts
application.mapper.ts       Database-to-API conversion
```

## Requirements

- Node.js 22 or newer
- npm
- Docker Desktop
- Git

## Installation

Clone the repository:

```bash
git clone https://github.com/neozeph/hyrd-v2.git
cd hyrd-v2
```

Install dependencies:

```bash
npm install
```

## Environment Setup

Copy the API environment example:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Copy the test environment example:

```powershell
Copy-Item apps/api/.env.test.example apps/api/.env.test
```

The local defaults expect PostgreSQL on port `5432`.

Never commit `.env` or `.env.test`.

### Cookie Authentication Security

HYRD uses HTTP-only session cookies. The browser cannot read the session token,
and frontend requests include credentials through the shared API client.

State-changing API requests also require a CSRF token:

1. The frontend calls `GET /api/auth/csrf` with credentials.
2. The API sets a host-only CSRF cookie and returns the signed token as JSON.
3. The frontend keeps the token in memory and sends it as `X-CSRF-Token` on
   `POST`, `PUT`, `PATCH`, and `DELETE` requests.

CORS, SameSite, and CSRF each solve different problems:

- CORS restricts which browser origins can read credentialed API responses.
- SameSite controls when cookies are sent during cross-site navigation or
  requests.
- CSRF tokens prove that an unsafe request came from HYRD's frontend code, not
  only from a browser that happens to hold a valid cookie.

Production settings:

- Use `NODE_ENV=production`.
- Set `CLIENT_ORIGIN` to the deployed frontend origin.
- Set `ENABLE_API_DOCS=false` or leave it unset in production unless API
  documentation should be intentionally exposed.
- Set `CSRF_SECRET` to a long random secret, at least 32 characters.
- Keep `TRUST_PROXY=false` locally. Use `TRUST_PROXY=1` only when the API runs
  behind exactly one trusted deployment proxy.
- Use `COOKIE_SAME_SITE=lax` for same-origin or same-site deployments when it
  works for the chosen hosting setup.
- Use `COOKIE_SAME_SITE=none` only when the frontend and API are cross-site
  HTTPS origins. Production cookies are `Secure` automatically.
- Do not set a broad cookie domain by default. Host-only cookies are safer for
  the API host.

## Database Setup

Start PostgreSQL:

```bash
docker compose up -d
```

Create the test database once:

```bash
docker exec hyrd-postgres createdb -U hyrd hyrd_test
```

Apply development migrations:

```bash
cd apps/api
npx prisma migrate dev
```

Apply migrations to the test database:

```bash
npx dotenv -e .env.test -- prisma migrate deploy
```

Return to the repository root:

```bash
cd ../..
```

## Development

Start the API:

```bash
npm run dev:api
```

The API runs at:

```text
http://localhost:3000
```

Health endpoint:

```text
GET http://localhost:3000/api/health
```

Interactive API documentation:

```text
http://localhost:3000/api/docs/
```

Raw OpenAPI document:

```text
http://localhost:3000/api/docs.json
```

API documentation is enabled by default outside production and disabled by
default when `NODE_ENV=production`. Set `ENABLE_API_DOCS=true` to expose
`/api/docs` and `/api/docs.json` explicitly, or `ENABLE_API_DOCS=false` to hide
them. When disabled, both routes return the normal API 404 response.

Readiness endpoint:

```text
GET http://localhost:3000/api/ready
```

`/api/health` is a lightweight liveness check and does not query PostgreSQL.
`/api/ready` checks whether the API can reach the database with a minimal Prisma
query. Use liveness to check whether the process is up, and readiness to decide
whether a deployment target should receive traffic.

## API Endpoints

| Method   | Endpoint                | Description             |
| -------- | ----------------------- | ----------------------- |
| `GET`    | `/api/health`           | Check API health        |
| `GET`    | `/api/applications`     | List applications       |
| `POST`   | `/api/applications`     | Create an application   |
| `GET`    | `/api/applications/:id` | Retrieve an application |
| `PATCH`  | `/api/applications/:id` | Update an application   |
| `DELETE` | `/api/applications/:id` | Delete an application   |

### Application Query Parameters

| Parameter   | Description                            | Default     |
| ----------- | -------------------------------------- | ----------- |
| `status`    | Filter by application status           | None        |
| `search`    | Search company or position             | None        |
| `sortBy`    | `createdAt`, `appliedAt`, or `company` | `createdAt` |
| `sortOrder` | `asc` or `desc`                        | `desc`      |
| `page`      | Requested page                         | `1`         |
| `limit`     | Results per page, maximum 100          | `20`        |

Example:

```http
GET /api/applications?status=interview&search=IBM&page=1&limit=10
```

## Available Commands

| Command                                       | Purpose                                  |
| --------------------------------------------- | ---------------------------------------- |
| `npm run dev:api`                             | Start the development API                |
| `npm run typecheck`                           | Check TypeScript                         |
| `npm test`                                    | Run automated tests                      |
| `npm run build`                               | Generate Prisma Client and build the API |
| `npm run db:check --workspace=@hyrd/api`      | Verify development database access       |
| `npm run prisma:studio --workspace=@hyrd/api` | Open Prisma Studio                       |

## Verification

Run all local quality checks:

```bash
npm run typecheck
npm test
npm run build
```

Tests use `hyrd_test`, not the development database.

## Continuous Integration

GitHub Actions runs on pushes and pull requests to `main`.

CI performs:

1. Dependency installation
2. PostgreSQL service startup
3. Database migration
4. Type checking
5. Automated tests
6. Production build

A failing step causes the workflow to fail.

## Application Statuses

- Saved
- Applied
- Screening
- Interview
- Assessment
- Offer
- Rejected
- Withdrawn

## Current Limitations

- Authentication has not been implemented.
- All API data currently belongs to one logical user.
- The React frontend has not yet been created.
- File uploads, email integration, and AI features are outside the current MVP.

## Planned Free Deployment

| Layer      | Provider                |
| ---------- | ----------------------- |
| Frontend   | Vercel Hobby            |
| API        | Render Free Web Service |
| PostgreSQL | Neon Free               |
| CI         | GitHub Actions          |

## License

This project is licensed under the MIT License.
