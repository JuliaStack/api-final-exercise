---
name: review-api-tests
description: Use before committing new or changed Playwright API tests in `tests/` to review them against the project's best practices and check they are consistent with the rest of the suite. Never edits tests or commits; when the verdict is not "Ready to commit" it writes the fixes to a markdown file `docs/<slug>/review.md`. Triggers on "review my tests", "check the tests before commit", "are my tests consistent", "review API tests", "code review the tests", "перевір тести перед комітом", "зроби рев'ю тестів", "чи відповідають тести патернам проєкту". Checks the layers (types → test-data → controller → json-schema → fixture → spec), spec structure (Arrange → Act → Assert, steps, tags, ids), test value (critical business risk, no duplicates, no unrequested edge cases) and cross-file consistency. The rules come from the `create-api-tests` skill.
model: opus
effort: high
---

# Reviewing API tests before commit

Review tests the way the project's author would: does each new or changed test follow the suite's patterns, protect a real business risk, and look like it was written by the same person as its neighbours?

This skill **only reviews**: it never edits `tests/`, stages or commits. Besides the chat reply, its only output is `docs/<slug>/review.md` (step 5). The user decides what to fix.

Sources, in priority order:

1. **What must be tested**: the approved plan `docs/<slug>/plan.md` (if any) and the user's scenarios/notes. The tests must implement them; the tests themselves are never evidence of intent.
2. **How tests are written**: `create-api-tests`. The checklist below is a condensed copy; if a rule is unclear or they disagree, read `.claude/skills/create-api-tests/SKILL.md`.
3. **Style reference**: committed tests in `tests/` around the change. On style they win over `docs/*.md` notes (which may lag), but never over 1 or 2.

## Honesty and completeness (every step)

The user relies on the review instead of re-reading the code, so a silent omission is worse than a wrong finding.

- **Report everything you notice**, nits included, as a finding with a severity. Never drop an observation because it is small, "probably fine", or the work looks good overall. A remark in a "Looks good" line or a check comment is not a finding.
- **A sibling doing the same thing is no defence.** If new code repeats a flaw of an older test, report it and name the sibling; the user decides whether to keep it for consistency.
- **Unsure is reportable**: mark it `unsure` with what you checked and what is unclear.
- **Don't soften the verdict.** `Ready to commit` means zero findings of any severity.
- **Say what you did not check** (tests not run, file skipped, status not verified against the route). Never claim a check you didn't make: "matches the route code" is true only if you opened the route and compared each status and message.

## Scope

1. **Paths given by the user** → review exactly those.
2. **Otherwise the uncommitted work under `tests/`:**
   ```bash
   git status --short tests
   git diff HEAD -- tests
   ```
   Untracked files don't show in `git diff`; read them in full. Nothing changed → say so and stop.
3. Review **only changed lines**. Untouched code is not a finding; mention it under "Pre-existing, not part of this change" only if it directly affects the new code (e.g. the new case copies a legacy pattern).

## Workflow

### 1. Build context (don't skip)

- Read `docs/<slug>/plan.md` first if it exists: planned scenarios, expected results, **Not planned**.
- Read each changed file in full, then its **siblings in the same layer** (specs, `test-data/`, controller, schema, `tests/fixtures.ts`). Treat `tests/dojo-courses/users/` (specs plus the fixtures, controller, test-data, types, schemas they use) as the reference for ideal coverage and style.
- For every spec, open the route in `src/app/api/...` (and `src/lib/validations/`) and compare **each** expected status and error message with what the code returns, not a sample.
- Check against **three references** and say in the report which you used:
  1. **Given docs**: plan, user notes, `create-api-tests`, and when relevant `src/app/api/docs/openapi.json` and the Prisma schema. Every planned scenario maps to a test; nothing from **Not planned** appears.
  2. **Existing code**: route handler, its validation schema, `src/lib/auth.ts`, `src/proxy.ts`. Expected results come from here, never from guessing.
  3. **Nearby tests**: for each new test find the closest existing one (same domain, or same kind of scenario elsewhere) and compare side by side: fixtures, steps, step wording, assertions, case-array shape, helpers. Every difference is a finding unless the plan or route requires it.
- Then a **line-by-line pass** over every changed test body and helper: find where each fixture/parameter is used and ask whether each statement is needed (see "Test body hygiene").

### 2. Mechanical checks

```bash
npx tsc --noEmit
npx prettier --check tests
grep -rhoE "API-[0-9]+" tests | sort | uniq -d     # duplicate test ids: must print nothing
```

If the user asks, or the change is small, also run the changed specs (`BASE_URL=http://localhost:3000/ npx playwright test <file>`; the default `BASE_URL` is a remote server). If tests were not run, say so; never claim they pass.

### 3. Review against the checklist

**Layers** (each depends only on the ones below; only what's needed was added):

- _Types_ (`tests/app/types/`): base `XxxFields` type, derived via `Pick` / `Partial`; no `any`; no duplicated shapes.
- _Data_ (`tests/app/test-data/<domain>-data.ts`): `buildXxxData()` builders with faker; uniqueness via `getRandomNumber()`; secrets from `process.env`, never hardcoded.
- _Negative cases_ (`invalid-<flow>-data.ts`): array of `{ id, title, overrides | buildPayload, ... }` with a unique `API-NNN` id. New cases use `overrides` or `buildPayload: () => ...`, **not** a `payload` computed at import time.
- _Controller_: `extends BaseController`; one method = one HTTP call; returns the raw `response`; **no assertions, `.json()` or logic**. Paths without leading `/`. Token via `headers: this.authHeaders(accessToken)`, never a hand-built `authorization` header. A new controller is a `readonly` field of `ApiClient` (`tests/app/api-client.ts`).
- _Schema_ (`tests/app/json-schemas/`): `z.strictObject`; a `// Response body of METHOD /api/...` comment; exported `type Xxx = z.infer<...>`; fields match the real response.
- _Fixtures_ (`tests/fixtures.ts`): added only when a precondition repeats. A new controller needs no fixture: it is reached through `apiClient.xxx` (on `api`, throws on non-2xx) and `rawApiClient.xxx` (on `request`); a per-controller fixture is a finding. Preconditions in `base.step("precondition: ...", ...)`. `Fixtures` type updated.

**Spec structure:**

- `test` / `expect` imported **only** from `../fixtures`, never `@playwright/test`.
- Describes: `test.describe("<flow>", ...)` positive, `test.describe("<flow> - negative scenarios", ...)` negative; **no tags on describes**. Every `test(...)` has its own tag as 2nd argument: `{ tag: "@regression" }`, plus `@smoke` only for a resource's main happy path (`{ tag: ["@regression", "@smoke"] }`); negatives and secondary flows are `@regression` only.
- Titles: `API-NNN: <subject> - should <expectation>`; in a loop `` `${id}: ${title} - should return ${status}` ``. Ids unique, continuing from the current highest. **Ids are stable:** gaps are fine; an existing (committed) id that was changed, shifted or reused is a blocker (check `git diff HEAD -- tests | grep -E "^[-+].*API-[0-9]+"`); a deleted test's id must not reappear.
- Everything inside `test.step(...)`; order request → status (if relevant) → schema → values.
- **Arrange → Act → Assert**:
  - Arrange: fixtures/builders/setup; setup steps prefixed `precondition:`; request data built here, not in the Act step; no assertions.
  - Act: exactly **one** `test.step` with the request under test.
  - Assert: separate `test.step`s, one check each; no new requests between Act and Assert except a follow-up read verifying a persisted change.
  - No `// Arrange` / `// Act` / `// Assert` comments.
- Schema check exactly as `const result = xxxSchema.safeParse(json); expect(result.error?.issues ?? []).toEqual([]);`, once per endpoint in the `@smoke` test (unless the endpoint has different schemas, e.g. `courseDetailSchema` after `courseSchema`).
- Value checks: **more than 2** fields of one body compared with expected values → **one** step with one `expect(json).toMatchObject({ ... })` (expected values built once, reused for response and follow-up GET). One or two fields may stay plain `toBe` / `toContain`. No `expect.soft`. A row of 3+ per-field `toBe` is a nit.
- `apiClient.xxx` for Arrange and happy paths; `rawApiClient.xxx` for the request under test in negatives.
- Negatives: a `for` loop over an array from `test-data/`; a single case with its own precondition (like `API-008`) is a standalone test in the same describe. Each asserts the status **and** the error field the route returns (`error`, `error_description`).
- Status checks: `apiClient` throws on non-2xx, so `status code matches 200` in positives is redundant (flag it); any other success status (e.g. `201`) **must** be asserted. **Every** negative needs a `status code matches ${status}` step.
- Tests are independent: each creates its own data; no seed data except `adminCredentials`; no ordering.

**Test value** ("why does this test exist"):

- Each test catches a real business risk (main flow → access control → money/data/access rules). Can't name the risk → flag.
- No duplicates of existing tests (grep `tests/dojo-courses/` for the route/controller method); no second case from an already covered equivalence class.
- No checks for fields the Zod schema already guarantees; assert only request-dependent values.
- No tests of framework/library behavior (Next.js, Prisma, Zod).
- No status-only test where the outcome matters (a change must persist: follow-up GET, like `update-user.spec.ts`).
- **No unrequested edge cases** (missing keys, exotic formats, boundaries, unicode, oversized bodies): flag them; the user must have asked.
- With a plan: every planned scenario has a test checking what the plan expects; nothing from **Not planned**. A missing scenario or contradicting expected result is a blocker.
- Statuses and messages match the plan and route code, not a guess. If plan and route disagree, report it for the user to decide; don't side with either.

**Test body hygiene** (line-by-line pass; each failure is a finding):

- Every fixture in a test's arguments is needed by **every** case of that test. A fixture used by only some loop cases (e.g. `userToken` for a case sending no token, which also registers an extra user per run) is a finding: split the case out or drop the fixture.
- No no-op/redundant code: a filter that can't change the result, a variable used once that only renames another, a step repeating the previous one.
- Assertions are as strict as the title/step claims. "Kept unchanged" compares the whole object, "is not created" checks the whole list, persistence needs a follow-up read. Flag a weaker assertion or a title promising more than is checked.
- Data can't make the test flaky over time (fixed dates, values colliding between runs/workers, tight clock margins).
- Setup uses the cheapest existing way (fixtures, builders), not repeated requests in the body.
- The claimed risk is really covered: if the plan says "schema OK" or "nothing was created" and the test doesn't check it, that is a finding (or a documented deviation: name it).

**Hygiene:** no `test.only` / `skip` / `fixme`; no `console.log`, `waitForTimeout`, commented-out code; no hardcoded URLs, emails, passwords; no `!` or `any` to silence the compiler; no unused imports/exports.

### 4. Consistency pass

Flag every place where the change introduces something new instead of copying what exists:

- names: files (`kebab-case`, `<domain>-data.ts`, `invalid-<flow>-data.ts`), exports, fixtures, case-array names, controller methods (verb + noun, e.g. `registerUser`);
- structure: describe/tag layout, title format, step wording (`status code matches 400`, `response body matches the ... schema`, `response contains an error message`), case-object keys and order;
- layering: data in the spec instead of a builder, a repeated precondition not a fixture, a repeated request not in a controller;
- new helpers, libraries or patterns where an existing one covers the task.

When a new file/test is the **second** of its kind and differs from the first, say which should change and why; not just "inconsistent". When new code **copies** a flawed sibling, don't accept it as "consistent": report it on the new code and name the sibling, so the user can fix both or keep the pattern.

### 5. Verdict and outcome

Severity:

- **Blocker**: fix before commit. A wrong or false-passing test (wrong expected status, assertion that can't fail, request in the wrong controller), `tsc`/`prettier` errors, duplicate ids, renumbered/reused id of an existing test, `test.only`, hardcoded secrets, import from `@playwright/test`, tests depending on each other or on seed data, more than one request in Act.
- **Should fix**: breaks a convention or weakens the test (assertions in a controller, import-time `payload`, missing `precondition:` prefix or tags, schema not `strictObject`, duplicate schema check, status-only where persistence matters, missing error-field check in a negative, missing status check in a negative or non-200 positive, redundant `status code matches 200`, duplicate or low-value test, unrequested edge case).
- **Nit**: harmless style/naming inconsistency (step wording, title phrasing, ordering, 3+ per-field `toBe` instead of `toMatchObject`).

A finding you can tie to a rule above, the plan, the route code or a concrete sibling is **not** padding and must be reported; one you can't tie to any is reported only as `unsure`. Don't suggest new abstractions; prefer the lightest fix that matches the existing pattern.

| Verdict                  | When                                                          | Outcome                              |
| ------------------------ | ------------------------------------------------------------- | ------------------------------------ |
| `Ready to commit`        | **zero findings of any severity**, nits and `unsure` included | chat reply only; **no file written** |
| `Ready after nits`       | only Nit or Should-fix findings (the user may commit)         | write the review file                |
| `Fix N blocker(s) first` | at least one Blocker (Should-fix items go in the same file)   | write the review file                |

**The review file** (any verdict except `Ready to commit`):

- Path: `docs/<slug>/review.md`, `<slug>` = the endpoint's folder shared with `plan.md` and `pipeline.md`: `<method>-<resource-path>`, kebab-case, path params dropped (e.g. `docs/patch-admin-users/review.md`). Reuse the existing folder, don't name it after the spec or flow; create it if needed. `docs/` is gitignored: a working note.
- If the file exists, it is the previous review of the same flow: read it, drop fixed findings, replace the file. Don't append.
- Exactly this structure, terse, one fix per checkbox:

````markdown
---
verdict: Fix 2 blocker(s) first
reviewed: 2026-11-18
files:
  - tests/dojo-courses/users/update-user.spec.ts
  - tests/app/test-data/update-user-data.ts
---

# Review: update user

## Mechanical checks

- `npx tsc --noEmit`: pass / fail (paste the errors)
- `npx prettier --check tests`: pass / fail (list the files)
- duplicate ids: none / `API-0NN`
- tests run: not run / N passed / failures (paste the output)

## Blockers

- [ ] **`tests/dojo-courses/<domain>/x.spec.ts:42`** — what is wrong.
      **Why:** the risk or the rule it breaks (name the sibling file it should match).
      **Fix:** the smallest change; a short snippet only if it isn't obvious.
````

Then, in the same shape (`- [ ]` items): `## Should fix`, `## Nits`. Then plain-bullet sections: `## Consistency notes` (where the change diverges from siblings, which side should move), `## Pre-existing, not part of this change` (only if it directly affects new code), `## Not checked` (what and why; "nothing" only if everything was checked), `## Edge cases worth a thought` (one line each, not findings), `## After fixing` (re-run `tsc`, `prettier --check tests` and the changed spec, then ask for a re-review). Omit empty sections. Every item follows **file:line → what is wrong → why → fix**, never a bare snippet.

## Reply to the user

In the user's language, short; details live in the file.

- **Verdict** in one line.
- **Mechanical checks**: one line each for `tsc`, `prettier`, duplicate ids, tests run or not.
- **References used**: which of plan / route code / nearby tests, and which sibling matched each new test.
- **Plan coverage** (with a plan): one line per scenario, `S-id → test ids → covered as planned / deviation (what)`. Every deviation is also a finding.
- If a file was written: its path, counts (`N blockers, N should fix, N nits`), and **every** finding as a one-liner linked `[name](path#Lline)`, nits included. Don't repeat the file's detail.
- **Not checked**: what you did not verify.
- **Edge cases noticed** (one line each, even for `Ready to commit`) and **Looks good** (one or two lines; never replaces a finding).
- `Ready to commit`: say so, that no file was written, and that nothing of any severity was found.

Then offer to apply the fixes from the file; don't apply or commit unless asked. When committing, `.md` files go in a separate commit: CI ignores them (`paths-ignore: "**.md"`), so they must not ride along with test changes.

## Orchestrated mode

When the prompt says the stage is orchestrated by `orchestrate-api-tests`, everything above applies except:

- **Scope:** files listed in the prompt count as "paths given by the user".
- **Resume:** start over from step 1. An existing review file is the previous round's; handle it per step 5. Ticked `- [x]` items were applied by the fix stage: verify each fix is really in the code before dropping it.
- **Reply:** instead of the user reply, end with the `STAGE_RESULT` block from the prompt.
  - `verdict`: the verdict.
  - `artifacts`: the review file path, or nothing for `Ready to commit`.
  - `summary`: mechanical-check results, counts `N blockers, N should fix, N nits`, plan coverage (`S-id → test ids`), every finding as a one-liner (blockers, should-fix **and** nits), what was not checked, edge cases noticed. The orchestrator relays this to the user, so anything left out is lost; make it as long as it needs to be.
  - Don't offer to apply fixes; the orchestrator decides.
