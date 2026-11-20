---
name: plan-endpoint-tests
description: Use when the user hands over an endpoint of the Dojo API (e.g. "POST /api/courses/{id}/purchase", a route file, or a resource name) and wants it analyzed before any test is written. Reads the route code and produces a markdown test plan in `docs/<slug>/plan.md` (capabilities, limitations, and a short prioritized list of scenarios, each tied to a business risk) that the `create-api-tests` skill can consume. Triggers on "analyze {endpoint}", "what should we test for {route}", "plan tests for {endpoint}", "make a test plan", "проаналізуй ендпоінт", "який план тестів на {ендпоінт}", "склади список тестів". Writes no test code.
model: opus
effort: high
---

# Planning tests for an endpoint

Turn one endpoint into a **short test plan** (a `.md` file) that another skill can implement. This skill only analyzes and plans. It writes no code under `tests/`.

The plan must protect **critical business scenarios**. Every scenario must answer "what real business risk does this catch?" If there is no answer, it doesn't go in the plan.

## Principles (how scenarios are chosen)

1. **Critical business scenarios first.** Priority order: the resource's main success flow (create / get / update / purchase / publish), then access control (401 without a token, 403 for a role without rights), then business rules that affect money, data, or access (409 conflict, 404 missing resource, key 400 validation).
2. **Test design, not brute force.** Pick the technique that fits, and name it in the plan:
   - _Equivalence partitioning_: one representative per class (empty value, invalid format, non-existing object), not several variants of one class.
   - _Decision table_: when the outcome depends on a combination of conditions (role × resource state × ownership). Write the table into the plan.
   - _State transitions_: for resources with a lifecycle (draft → published, unpaid → purchased).
   - _Error guessing_: only for risky spots you can actually see in the route's code. Cite the line.
3. **Edge cases are not planned.** Missing keys, exotic formats, boundary values, unicode, oversized bodies go into the "Edge cases noticed" section as one line each, never into the scenario table. Plan them as scenarios only if the user explicitly asked for edge cases.
4. **No scenarios for the sake of scenarios.** Leave out:
   - what existing specs in `tests/dojo-courses/` already cover;
   - a second case from an equivalence class that is already represented;
   - fields the Zod schema already guarantees (only values that depend on the request are worth asserting);
   - framework or library behavior (Next.js routing, Prisma, Zod internals) rather than the API's business logic;
   - status-only checks where the outcome matters (a change must persist, so the plan says "verify with a follow-up GET").
   - a separate scenario for a `200` status alone (the `api` context already fails on non-2xx, so a happy path doesn't assert `200`).
5. **Statuses in the plan.** Every negative scenario names the exact status (and error text) it expects, since the tests will assert it. A positive scenario names its status only when it is not `200` (e.g. `201`); the tests assert that one explicitly.
6. **Consistency with the suite.** The plan should lean on what already exists (controllers, fixtures, builders, schemas, case-array format) and name what is missing. Don't propose new patterns or libraries.

## Workflow

### 1. Resolve the endpoint

Map the user's input to a route file under `src/app/api/**/route.ts` and an HTTP method. If the input names a resource but not a method, or matches several routes, list the candidates and ask. One plan covers one method of one route, so don't merge endpoints.

### 2. Read the code (the code wins over docs)

- The handler: body/query/path params, success status and response shape, every early return with its status and `error` text, every DB write, and anything computed (price, counters).
- Auth: whether `requireAuth` or `requireAdmin` is called, and whether the route is public in the whitelist of `src/proxy.ts`. Remember `proxy.ts` only checks that a Bearer header is present; real verification and role checks are in the handler.
- Validation: the Zod schema in `src/lib/validations/` or hand-written field checks.
- Data: the Prisma models involved in `prisma/schema.prisma` (unique constraints, relations, defaults) and the state fields that gate behavior (`isPublished`, `isActive`, `expiresAt`, ...).
- Docs: the entry in `src/app/api/docs/openapi.json`. Note every place where it disagrees with the code.

### 3. Check what the suite already has

- Grep `tests/dojo-courses/` for the route path and its controller method, to find existing coverage.
- Read `tests/app/controllers/`, `tests/fixtures.ts`, `tests/app/test-data/`, `tests/app/json-schemas/`, `tests/app/types/`, and list what can be reused and what must be added, per layer.
- Read `docs/test-writing-order.md` for the author's conventions. It may lag the code.

### 4. Analyze capabilities and limitations

- **Capabilities**: what the endpoint can do for each actor (anonymous / user / owner / admin), including side effects (records created, counters changed, prices computed).
- **Limitations**: what it rejects (status + message), what state it requires, what it **silently ignores** (e.g. an invalid optional field that is dropped instead of rejected), and what it doesn't check at all.
- **Suspicious spots**: behavior that looks like a bug or that contradicts `openapi.json`. These are findings, not tests. Report them as questions, don't bake a guess into an expected result.

### 5. Select scenarios

For each capability or limitation, apply the principles above and keep only scenarios with a clear business risk. Order by priority (main flow → access control → business rules). Prefer fewer, sharper scenarios; a plan with 3 to 8 scenarios is typical, and fewer is fine. For each, decide the technique and the **expected result taken from the code**, not guessed.

Do not assign `API-NNN` ids. Use `S1`, `S2`, ... so the plan doesn't go stale or collide with other work; `create-api-tests` assigns real ids when it writes the tests.

### 6. Write the plan

Save to `docs/<slug>/plan.md`, where `<slug>` is `<method>-<resource-path>`, kebab-case, path params dropped (e.g. `docs/post-courses-purchase/plan.md`). The folder `docs/<slug>/` holds everything for this endpoint (`plan.md`, `review.md`, `pipeline.md`). Create the directory if needed. `docs/` is gitignored, which is fine: the plan is a working handoff, not a deliverable. If the file already exists, show the user what would change instead of silently overwriting.

Use exactly this structure, so the consuming skill can parse it. Keep it terse: tables and one-liners, no prose essays.

````markdown
---
endpoint: POST /api/courses/{courseId}/purchase
route: src/app/api/courses/[courseId]/purchase/route.ts
status: draft
---

# Test plan: POST /api/courses/{courseId}/purchase

## Summary

One or two sentences: what the endpoint does and why it matters to the business.

## Contract (from code)

- **Auth:** requireAuth (any logged-in user); not public.
- **Request:** body `{ promoCode?: string }`.
- **Success:** 201, purchase record `{ ... }`.
- **Errors:** 401 no/invalid token; 404 `Course not found` (missing or unpublished); 409 `Already purchased`.
- **Side effects:** creates `Purchase`; with a valid promo also creates `PromoCodeUsage` and increments `currentUses`.

## Capabilities and limitations

| Actor / condition | Outcome | Source (file:line) |
| ----------------- | ------- | ------------------ |

Plus a short bullet list of things it silently ignores or doesn't check.

## Scenarios

| ID  | Title | Technique | Priority | Business risk it catches | Expected result |
| --- | ----- | --------- | -------- | ------------------------ | --------------- |
| S1  | ...   | ...       | main flow / access / business rule | ... | status + body/state check (name the follow-up GET if state must persist) |

If a decision table is used, put it here under the scenarios.

## Reuse and gaps (per layer)

| Layer | Reuse | Add |
| ----- | ----- | --- |
| types / test-data / controller / schema / fixtures / spec file | existing names | what is missing |

## Not planned (deliberately)

- What was left out and why (already covered by `<spec>`, same equivalence class as S2, framework behavior, ...).

## Edge cases noticed (not planned)

- One line each. Planned only if the user asks.

## Open questions

- Code vs `openapi.json` discrepancies and suspicious behavior, each with the evidence. Empty if none.
````

### 7. Reply to the user

Short: the path of the plan file, the scenario list as `S-id: title (risk)`, what was deliberately left out, any open questions or suspected bugs, and the one-line edge cases. Then say how to proceed: ask `create-api-tests` to implement the plan, passing the file path. Don't start writing tests yourself.

## Hand-off contract

The plan is the interface to `create-api-tests`. Keep these stable: front matter keys, the section headings, the scenario table columns, and `S`-ids. The consumer treats **Scenarios** as the list to implement, **Reuse and gaps** as the layer checklist, and **Not planned** / **Edge cases noticed** as things not to implement unless the user says so.

## Model

This skill runs on **Opus with high effort**. When the `orchestrate-api-tests` skill runs it, the orchestrator passes `model: opus, effort: high` to the subagent.

## Orchestrated mode

Use this when the prompt says the stage is orchestrated by `orchestrate-api-tests`. Everything above still applies, except:

- **Step 1:** the endpoint is already resolved to one method of one route; don't ask about it. If it still turns out to be ambiguous, stop and return `needs_user` with the candidates.
- **Step 6:** if the prompt says `Resume: yes` and the plan file exists, it is your own unfinished draft. Finish and overwrite it without showing a diff. Without `Resume: yes`, an existing file still means showing the change: return `needs_user` with a short summary of what would change.
- **Step 7:** instead of the reply to the user, end with the `STAGE_RESULT` block from the prompt:
  - `artifacts`: the plan path;
  - `summary`: the scenarios as `S-id: title (risk)`, what was left out, and the one-line edge cases;
  - open questions and suspected bugs also go in `summary`.

  Don't tell anyone to call `create-api-tests`; the orchestrator does that.
