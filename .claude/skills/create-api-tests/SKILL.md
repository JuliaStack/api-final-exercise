---
name: create-api-tests
description: Use when adding or extending Playwright API tests for the Dojo API in `tests/`, whether for a new endpoint, a new business flow, or negative scenarios for an existing one. Triggers on "write tests for {endpoint}", "cover {route} with tests", "add API tests", "add negative scenarios", "напиши тести на {ендпоінт}", "покрий тестами", "додай негативні сценарії". Covers critical business scenarios first using test design techniques (equivalence partitioning, decision tables, state transitions), reuses the suite's existing layers and patterns (types → test-data → controller → json-schema → fixture → spec), and adds edge cases only when the user explicitly asks for them.
model: sonnet
effort: high
---

# Creating API tests

The goal is tests that protect **critical business scenarios** and look as if the project's author wrote them. Every test must answer the question "what real business risk does this catch?" If there is no answer, don't write the test.

## Principles

1. **Critical business scenarios first.** Priority order: the resource's main success flow (create / get / update / purchase / publish), then access control (401 without a token, 403 for a role without rights), then business rules that affect money, data, or access (409 conflict, 404 missing resource, key 400 validation).
2. **Test design, not brute force.** Pick the technique that fits the task:
   - _Equivalence partitioning_: one representative per class (empty value, invalid format, non-existing object), not five variants of the same class.
   - _Decision table_: when the outcome depends on a combination of conditions (role × resource state × ownership).
   - _State transitions_: for resources with a lifecycle (draft → published, unpaid → purchased).
   - _Error guessing_: only for risky spots you can actually see in the route's code.
3. **Edge cases only on explicit request.** By default, don't add missing keys, exotic formats, boundary values, unicode or oversized bodies. If you notice an edge case worth covering, mention it in one line in your reply, but don't write the test.
4. **No tests for the sake of tests.** Don't write:
   - duplicates of existing tests (check `tests/dojo-courses/` and its `auth/`, `users/`, `courses/` subfolders first);
   - cases from an equivalence class that is already covered;
   - separate checks for fields the Zod schema already guarantees (only assert values that depend on the request: email, name, updated fields);
   - checks of framework or library behavior rather than the API's business logic;
   - status-only tests where the outcome matters (e.g. a change must persist, so verify it with a follow-up GET, as `update-user.spec.ts` does).
5. **Consistency beats personal style.** Before writing, read the existing files of each layer and copy their shape: naming, structure, step wording, case format. Don't introduce new patterns, helpers, or libraries when the existing ones cover the task.

## Workflow

### Start: was a plan handed over?

1. **A plan was handed over** (a path to a file made by the `plan-endpoint-tests` skill, e.g. `docs/test-plans/post-courses-purchase.md`): work from it and skip steps 0 and 1 below.
   - Its **Scenarios** table is the list of tests to write, and its **Reuse and gaps** table is your layer checklist for step 2.
   - Anything under **Not planned** or **Edge cases noticed** stays unwritten unless the user asks.
   - Replace the plan's `S1`, `S2`, ... ids with real `API-NNN` ids (use the "next free id" command from step 0).
   - Read the existing files of each layer before writing. If the route changed after the plan was written, trust the code and tell the user what differs.
   - Go straight to step 2; the user has already seen the scenarios in the plan.
2. **No plan was handed over:** say so in one line (e.g. "No plan file given, analyzing the endpoint myself") and start working on your own. Don't wait for a plan and don't ask for one. Run steps 0 and 1 as written; step 1 is where the user confirms the scenarios.
3. **A review file was handed over** (from the `review-api-tests` skill, e.g. `docs/test-reviews/update-user.md`): this is fix mode. Don't add scenarios or tests.
   - Apply every unchecked item under **Blockers** and **Should fix**, in that order. Apply **Nits** only if asked.
   - Each item gives file:line, what is wrong and the fix. Make that smallest fix, matching the sibling file it names, and change nothing else.
   - After each applied item, change its `- [ ]` to `- [x]` in the review file, so an interrupted run can continue. Leave the rest of the file alone; the next review replaces it.
   - If an item is wrong (the code or the route says otherwise), don't apply it. Leave it unchecked and say why in the reply.
   - Then run step 4.

### 0. Discovery (no plan handed over; no code yet)

- Open the route in `src/app/api/...` and note: what it accepts, what it returns on success, which statuses and error messages it produces, and which `requireAuth` / `requireAdmin` checks apply. Cross-check with `src/lib/validations/` and, if needed, `src/app/api/docs/openapi.json`.
- Read `docs/test-writing-order.md` and the existing specs and layers in `tests/app/`. The docs can lag behind the code; the code wins.
- Find the next free id: `grep -rhoE "API-[0-9]+" tests | sort -t- -k2 -n | tail -1`.

### 1. Scenario plan (no plan handed over): show it to the user before writing code

A short list: `id`, title, test design technique, and **why it is critical** (which risk it catches). Separately list what you deliberately leave out (edge cases, uninformative errors). Wait for confirmation if there are more than two scenarios or the plan isn't obvious.

### 2. Implement layer by layer (bottom up)

Each layer depends only on the ones below it. Add only what doesn't exist yet.

| Layer          | File                                           | Pattern                                                                                                                                                                                                               |
| -------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types          | `tests/app/types/<domain>.ts`                  | A base `XxxFields` type, derived types via `Pick` / `Partial` (like `RegisterUserData`, `TokenRequestData`).                                                                                                          |
| Data           | `tests/app/test-data/<domain>-data.ts`         | A `buildXxxData()` builder using faker; unique fields via `getRandomNumber()`; secrets from `process.env`.                                                                                                            |
| Negative cases | `tests/app/test-data/invalid-<flow>-data.ts`   | An array of `{ id, title, overrides \| buildPayload, status }`. For new cases use `overrides` on top of a builder or `buildPayload: () => ...`, **not** a ready-made `payload` computed at import time.               |
| Controller     | `tests/app/controllers/<domain>-controller.ts` | `extends BaseController`; one method = one HTTP call, returns the `response`, **no assertions**. Paths have no leading `/` (`"api/courses"`). Pass the token as `headers: { authorization: \`Bearer ${token}\` }`.    |
| Schema         | `tests/app/json-schemas/<domain>.ts`           | `z.strictObject`, a `// Response body of METHOD /api/...` comment, and an exported `type Xxx = z.infer<...>`.                                                                                                         |
| Fixtures       | `tests/fixtures.ts`                            | Only when a precondition repeats. For a new controller, add a pair: `xxxController` (on `api`, throws on non-2xx) and `rawXxxController` (on `request`). Wrap preconditions in `base.step("precondition: ...", ...)`. |
| Spec           | `tests/dojo-courses/<domain>/<flow>.spec.ts`   | See below.                                                                                                                                                                                                            |

### 3. Spec file structure

- Import `test` and `expect` **only** from `../fixtures`.
- `test.describe("<flow>", ...)` for positive tests and `test.describe("<flow> - negative scenarios", ...)` for negative ones, **without tags**. Tags go on each test, as the second argument: `test("API-NNN: ...", { tag: "@regression" }, async ({ ... }) => {...})`. Every test is `@regression`; only the main happy path of a resource also gets `@smoke` (`tag: ["@regression", "@smoke"]`). Negatives, business rules and secondary flows (e.g. admin-side) are `@regression` only. Keep smoke small: one test per resource.
- Test title: `API-NNN: <subject> - should <expectation>`; in a loop: `` `${id}: ${title} - should return ${status}` ``.
- Wrap everything in `test.step(...)`. Order: request → status (if relevant) → schema → values.
- Follow **Arrange → Act → Assert**, in that order, with one Act per test:
  - **Arrange**: fixtures, builders, and setup calls. Name setup steps with the `precondition:` prefix, as the fixtures do. Build request data here, not inside the Act step (a plain `{ ...base, ...overrides }` spread is fine). No assertions in Arrange.
  - **Act**: exactly one `test.step` that makes the request under test.
  - **Assert**: separate `test.step`s after the Act, one check each. Make no new requests between the Act and the Assert, except a follow-up read that verifies a state change persisted (as in `update-user.spec.ts`); that read belongs to Assert.
  - Don't add `// Arrange` / `// Act` / `// Assert` comments; the project marks phases with step names.
- Check the schema exactly like this:
  ```ts
  const result = xxxSchema.safeParse(json);
  expect(result.error?.issues ?? []).toEqual([]);
  ```
- **Schema check: once per endpoint, in the `@smoke` test.** Exception: an endpoint that has different schemas (e.g. `courseDetailSchema` after `courseSchema`).
- **Value checks on one object.** When **more than 2** fields of the same response body (or of a follow-up GET) are compared with expected values, check them in **one** `test.step` with a single `expect(json).toMatchObject({ ... })`, not one `expect(json.field).toBe(...)` per field. Up to 2 field checks may stay as plain `expect(...).toBe(...)` lines (e.g. `title` and `slug`). A failure then shows every wrong field at once, and this counts as "one check" for the one-check-per-step rule. Build the expected values once (e.g. `const expectedFields = { ... }`) and reuse the object for the response and for the follow-up GET. Compute derived values (`String(price)`, `JSON.stringify(list)`) inside that object. For a nested array use `toMatchObject` with `expect.objectContaining(...)` per element; the array length still has to match. Keep a plain `toBe` / `toContain` for one or two fields. Don't use `expect.soft`; the suite has no use for it.
- Use `xxxController` for Arrange steps and happy paths; use `rawXxxController` for the request under test in negative scenarios.
- **Status code checks.** `xxxController` runs on `api` with `failOnStatusCode: true`, so it already throws on any non-2xx. In positive scenarios:
  - success status is `200`: **don't** add a `status code matches 200` step, it is redundant (as in `get-user-info.spec.ts`);
  - success status is any other 2xx (e.g. `201`): **do** assert it with a `status code matches 201` step, because the fixture would also accept a `200`.
  - Negative scenarios: **every** one asserts the status with a `status code matches ${status}` step on the `rawXxxController` response, before the error field. No negative test goes without a status check.
- Negative scenarios are a `for` loop over an array from `test-data/`. A single case that needs its own precondition (like `API-008` existing user) is a standalone test in the same describe.
- In negative tests, assert the status and the error field the route actually returns (`error`, `error_description`). If the text is meaningful (it says what went wrong, e.g. `Account is deactivated`, `No valid fields to update`), assert that text with `toContain(...)` so the test shows which error is expected. Only when the text is generic or uninformative, assert it is present (`toBeTruthy()`).
- Tests are independent: each one creates its own data through fixtures and builders and doesn't rely on seed data, except `adminCredentials`.
- Treat `tests/dojo-courses/users/` as the reference for ideal coverage and style: its specs plus the fixtures, controller, test-data, types and schemas they use.

### 4. Verify before handing over

```bash
npx tsc --noEmit
npx prettier --check tests
npx playwright test tests/dojo-courses/<domain>/<flow>.spec.ts
```

The default `BASE_URL` is a remote training server; for a local one use `BASE_URL=http://localhost:3000/ npx playwright test ...`. If the tests couldn't be run, say so plainly and include the error output.

## Reply to the user

For each changed file: what was added and why. Separately: which scenarios are covered, which were deliberately skipped (and why), and which edge cases can be added on request.

## Model

This skill runs on **Sonnet with high effort**. When the `orchestrate-api-tests` skill runs it, the orchestrator passes `model: sonnet, effort: high` to the subagent.

## Orchestrated mode

Use this when the prompt says the stage is orchestrated by `orchestrate-api-tests`. Everything above still applies, except:

- **You can't talk to the user.** Step 1 (no plan handed over): don't wait for a confirmation. Stop and return `needs_user`, with the scenario list as the `question`. The answer comes back in a follow-up message; continue from step 2 with it.
- **Checkpoint after each layer.** The state file path is in the prompt. After finishing each step-2 layer, and after step 4, update the `Checkpoint` cell of your stage's row, e.g. `types ✓ data ✓ controller ✓ schema ☐ fixtures ☐ spec ☐ verify ☐`. Mark a layer that needs no change as `✓` too. In fix mode the ticked checkboxes in the review file are the checkpoint; add only `verify ✓` to the cell.
- **Resume** (`Resume: yes` in the prompt):
  1. Read the checkpoint, `git status --short tests`, and the files already written. Files on disk win over the checklist.
  2. Continue from the first unfinished layer; don't rewrite finished ones.
  3. Keep the `API-NNN` ids already assigned; the "next free id" grep already counts them.
- **Reply:** instead of the reply to the user, end with the `STAGE_RESULT` block from the prompt.
  - `artifacts`: every file you created or changed.
  - `summary`: the ids assigned, the scenarios covered and skipped, the `tsc` / `prettier` / playwright results (say plainly if tests weren't run), and the edge cases noticed.
  - Use `partial` with the checkpoint if you have to stop before step 4 is done.
