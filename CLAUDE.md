# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Two things in one repo:

1. **The API under test** (`src/`): "Dojo API", a Next.js 16 app with API routes only (no UI), Prisma 7 + MariaDB/MySQL, OAuth2/JWT auth. See [README.md](README.md) for setup, auth flow examples, and seeded accounts.
2. **The Playwright API test suite** (`tests/`): the actual exercise. Most day-to-day work happens here.

## Commands

```bash
npm run dev          # Next dev server (turbopack) on :3000
npm run db:push      # push prisma/schema.prisma to the DB (no migrations are used)
npm run db:seed      # seed sample data (prisma/seed.ts)
npm run db:studio    # Prisma Studio on :5555
npm run build        # prisma generate && next build

npm test                                            # all Playwright tests
npx playwright test tests/dojo-courses/users/get-user-info.spec.ts   # one file
npx playwright test -g "API-010"                    # one test by id/title
npx playwright test --grep @smoke                   # by tag (@smoke, @regression)

npx tsc --noEmit                                    # type-check (src + tests)
```

Notes:
- `src/generated/prisma/` is generated and committed; `postinstall`/`build` regenerate it. Don't hand-edit.
- Playwright's default `BASE_URL` is a **remote** training server (`http://104.168.59.50/training-api/`), not localhost. To test a local server: `BASE_URL=http://localhost:3000/ npm test`. Keep the trailing slash; request paths in controllers have no leading slash.
- Tests need `.env` values beyond the app's: `BASE_URL`, `DEFAULT_USER_PASSWORD`, `ADMIN_EMAIL` (see `.env.example`). The admin account's password is `DEFAULT_USER_PASSWORD`.
- `tests/dojo-courses/global-setup.ts` does a `GET api/courses` smoke check before any test runs, so an unreachable `BASE_URL` fails the whole run immediately.
- `npm run lint` uses `eslint.config.mjs`: Next's configs for the whole repo, plus `eslint-plugin-playwright` (recommended) for `tests/**`. In tests, React's `rules-of-hooks` (false positives on fixture `use`) and `playwright/consistent-spacing-between-blocks` are off; `scratch/` and `src/generated/` are ignored.

## Test suite architecture (`tests/`)

Layered; each layer only depends on the ones below it:

- `app/types/` — request/entity types (e.g. `RegisterUserData`, `UpdateUserData`).
- `app/test-data/` — data builders (`buildUserData`, `buildTokenRequestData`, faker-based) and arrays of negative cases (`invalid-*-data.ts`, each with an `id` like `API-002`, a `title`, input, and expected result).
- `app/controllers/` — thin wrappers over `APIRequestContext` extending `BaseController`. They make the HTTP call and return the raw response; **no assertions**.
- `app/json-schemas/` — Zod schemas for response bodies; specs assert with `schema.safeParse(json)` and `expect(result.error?.issues ?? []).toEqual([])`.
- `fixtures.ts` — the single `test`/`expect` export; specs must import from here, not `@playwright/test`. Fixture chain: `api` → `userController` → `registeredUser` → `userToken`; plus `adminToken`.
- `dojo-courses/<domain>/*.spec.ts` — the specs, grouped by domain: `auth/`, `users/`, `courses/` (`global-setup.ts` stays in the root of `dojo-courses/`).

Key convention: two controllers exist on purpose.
- `userController` uses the `api` context with `failOnStatusCode: true`, so it **throws on non-2xx**. Use it for Arrange steps and happy paths.
- `rawUserController` uses Playwright's default `request`, which does not throw. Use it for the request under test in negative scenarios (4xx assertions).

Other conventions seen throughout the specs: test titles are prefixed with an id (`API-010: ...`); everything is wrapped in `test.step(...)`; tags are set on each test (`test(title, { tag: ... }, fn)`), not on describes: every test is `@regression`, and only the main happy path of a resource is also `@smoke`; negative scenarios are a `for` loop over a case array from `test-data/`; setup steps in specs are named `precondition: ...` (same as in the fixtures).

`docs/` (gitignored, written in Ukrainian) holds the author's own notes on the intended order of writing a test (types → data → controller → schema → fixture → spec → negatives), fixture structure, and a pending refactor (`payload` → `buildPayload()`). Read `docs/test-writing-order.md` before adding a new test; note the docs may lag the code slightly (e.g. the negative-case array is now named `invalidRegistrationData`).

When adding a test, open the corresponding route in `src/app/api/...` first to see what it accepts, returns, and which error statuses/messages it produces.

## Test-writing skills (`.claude/skills/`)

`plan-endpoint-tests` → `create-api-tests` → `review-api-tests`, chained by `orchestrate-api-tests` (runs each as a subagent and keeps resumable state). They hand work over through files in a gitignored per-endpoint folder `docs/<slug>/` (`<method>-<resource-path>`, e.g. `docs/post-courses-purchase/`) holding `plan.md`, `review.md` and `pipeline.md`. `create-api-tests` holds the test-writing rules; none of the skills commit.

## API architecture (`src/`)

- **Routes**: one `route.ts` per resource under `src/app/api/**` (Next App Router handlers). Domains: auth/oauth, admin (users, promo codes), courses (+ chapters, attachments, publish, purchase, validate-promo), categories, tags, posts, youtube-videos, progress, purchases, learning-paths, uploads.
- **Auth is two-stage**: `src/proxy.ts` (Next 16's replacement for `middleware.ts`, matcher `/api/:path*`) only checks that a `Bearer` header is *present* and whitelists public routes (`/api/auth/*`, `/api/oauth/token`, `/api/docs*`, `/api/uploads*`, and GET-only for courses/categories/tags/posts/youtube-videos). Actual token verification and role checks happen inside each handler via `requireAuth` / `requireAdmin` from `src/lib/auth.ts`, which throw `AuthError` (401/403); handlers convert it with `errorResponse` from `src/lib/errors.ts`. A new public endpoint must be added to the whitelist in `proxy.ts`.
- **Tokens**: `src/lib/jwt.ts` — HS256 access tokens (15 min, issuer `dojo-api`, payload `sub/role/scopes/type` where `type` is `user` or `client`), opaque UUID refresh tokens stored in DB. Grants supported at `/api/oauth/token`: password, refresh_token, client_credentials.
- **DB**: `src/lib/prisma.ts` lazily creates a singleton `PrismaClient` behind a `Proxy` (so importing it doesn't require `DATABASE_URL` at build time) and rewrites `mysql://` to `mariadb://` for the `@prisma/adapter-mariadb` driver. Schema in `prisma/schema.prisma`; generated client imports come from `@/generated/prisma/client` (alias `@/*` → `src/*`).
- **Validation**: Zod schemas in `src/lib/validations/`; some handlers (e.g. `admin/users/[userId]`) instead whitelist fields by hand.
- **API docs**: `src/app/api/docs/openapi.json` is the hand-maintained OpenAPI spec, served at `/api/docs` (Scalar UI) and `/api/docs/spec`. `scratch/update_openapi.js` is a one-off script that patches it; update the JSON when routes change.

## CI

`.github/workflows/playwright.yaml` (comments in Ukrainian) runs on push to `main` and manual dispatch (input `url`): spins up MySQL 8.4, `db:push` + `db:seed`, starts `npm run dev`, then runs Playwright. On push, `BASE_URL` falls back to `http://localhost:3000/`. Secrets/vars needed: `JWT_SECRET`, `DEFAULT_USER_PASSWORD`, `DATABASE_URL`, `UPLOAD_DIR`, `ADMIN_EMAIL`. The number of workers is not set in the workflow; it comes from `playwright.config.ts` (2 when `CI` is set). Pushes that change only `.md` files don't trigger it (`paths-ignore: "**.md"`); manual dispatch always runs.
