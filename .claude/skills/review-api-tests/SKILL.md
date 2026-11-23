---
name: review-api-tests
description: Use before committing new or changed Playwright API tests in `tests/` to review them against the project's best practices and check they are consistent with the rest of the suite. Never edits tests or commits; when the verdict is not "Ready to commit" it writes the fixes to a markdown file `docs/<slug>/review.md`. Triggers on "review my tests", "check the tests before commit", "are my tests consistent", "review API tests", "code review the tests", "перевір тести перед комітом", "зроби рев'ю тестів", "чи відповідають тести патернам проєкту". Checks the layers (types → test-data → controller → json-schema → fixture → spec), spec structure (Arrange → Act → Assert, steps, tags, ids), test value (critical business risk, no duplicates, no unrequested edge cases) and cross-file consistency. The rules come from the `create-api-tests` skill.
model: opus
effort: high
---

# Reviewing API tests before commit

Review tests the way the project's author would: does each new or changed test follow the suite's patterns, protect a real business risk, and look like it was written by the same person as its neighbours?

This skill **only reviews**: it never edits `tests/`, stages or commits. Besides the chat reply, its only output is a review file `docs/<slug>/review.md` (step 5). The user decides what to fix.

Sources, in priority order:

1. **What must be tested**: the approved plan `docs/<slug>/plan.md` (if there is one) and the scenarios or notes the user gave. The tests under review must implement them; the tests themselves are never evidence of what was intended.
2. **How tests are written**: `create-api-tests`. The checklist below is a condensed copy; if a rule is unclear or the two disagree, read `.claude/skills/create-api-tests/SKILL.md`.
3. **Style reference**: the existing committed tests in `tests/` around the change. On style they win over the author's notes in `docs/*.md` (which may lag), but never over 1 or 2.

The changed code is what's under review, not a source of truth.

## Honesty and completeness (applies to every step)

The review must be honest and complete. The user relies on it instead of re-reading the code, so a silent omission is worse than a wrong finding.

- **Report everything you notice.** Every deviation from the plan, the route code, `create-api-tests` or the neighbouring tests becomes a finding with a severity, nits included. Never drop an observation because it is small, because it is "probably fine", or because the work looks good overall.
- **Never mention a problem in passing and then leave it out of the findings.** If while reviewing you think "this differs from X" or "this is redundant", it goes into the report as a finding. A remark in a "Looks good" line or a mechanical-check comment doesn't count.
- **A sibling doing the same thing is not a defence.** If the new code repeats a flaw that exists in an older test, report it anyway as a finding (name the sibling, say it's the same there). The user decides whether to keep it for consistency; you don't decide for them.
- **Unsure is still reportable.** If you can't tell whether something is a problem, report it marked `unsure` with what you checked and what is unclear. Don't silently skip it.
- **Don't soften the verdict.** `Ready to commit` means you found nothing at all, of any severity. If you found anything, even a nit, the verdict is `Ready after nits` and the file is written.
- **Say what you did not check.** If you didn't run the tests, skipped a file, or could not verify an expected status against the route, list that explicitly; don't let the reader assume it was covered.
- **Never claim a check you didn't make.** "Matches the route code" is only true if you opened the route and compared each status and message.

## Scope: what to review

1. **Paths given by the user** → review exactly those.
2. **Otherwise the uncommitted work under `tests/`:**
   ```bash
   git status --short tests
   git diff HEAD -- tests
   ```
   Untracked files don't show in `git diff`; read them in full. If nothing is changed under `tests/`, say so and stop.
3. Review **only changed lines**. Untouched code is not a finding, even if it breaks a rule; mention it under "Pre-existing, not part of this change" only if it directly affects the new code (e.g. the new case copies a legacy pattern).

## Workflow

### 1. Build context (don't skip)

- If `docs/<slug>/plan.md` exists (or a plan path was given), read it first: the planned scenarios, their expected results, and what is under **Not planned**.
- Read each changed file in full, then its **siblings in the same layer** (other specs, other `test-data/` files, the controller, the schema file, `tests/fixtures.ts`). Consistency can only be judged against them.
- Treat `tests/dojo-courses/users/` as the reference for ideal coverage and style: its specs plus the fixtures, controller, test-data, types and schemas they use.
- For every spec under review, open the route it hits in `src/app/api/...` (and `src/lib/validations/`) to check that expected statuses and error fields match what the code really returns. Compare **each** expected status and error message with the code, not a sample.
- Check the tests against **three kinds of reference**, and say in the report which ones you used:
  1. **The given docs**: the plan, the user's notes, `create-api-tests`, and (when relevant) `src/app/api/docs/openapi.json` and the Prisma schema. Every planned scenario must map to a test; nothing from **Not planned** may appear.
  2. **The existing code**: the route handler, its validation schema, `src/lib/auth.ts`, `src/proxy.ts`. Expected results come from here, never from guessing.
  3. **The tests nearby**: for every new test, find the closest existing test (same domain, or the same kind of scenario in another domain) and compare it with the new one side by side: fixtures requested, steps, step wording, assertions, case-array shape, helpers used. Every difference is a finding unless the plan or the route code requires it.
- Then do a **line-by-line pass** over every changed test body and every changed helper. For each fixture or parameter in the test's arguments, find where it is used. For each statement, ask whether it is needed. See "Test body hygiene" in the checklist.

### 2. Run the mechanical checks

```bash
npx tsc --noEmit
npx prettier --check tests
grep -rhoE "API-[0-9]+" tests | sort | uniq -d     # duplicate test ids: must print nothing
```

If the user asks, or the change is small, also run the changed specs (`BASE_URL=http://localhost:3000/ npx playwright test <file>` for a local server; the default `BASE_URL` is a remote training server). If tests were not run, say so; never claim they pass.

### 3. Review against the checklist

**Layers** (each depends only on the ones below it; only what's needed was added):

- _Types_ (`tests/app/types/`): a base `XxxFields` type, derived via `Pick` / `Partial`; no `any`; no duplicated shapes.
- _Data_ (`tests/app/test-data/<domain>-data.ts`): `buildXxxData()` builders with faker; uniqueness via `getRandomNumber()`; secrets and credentials from `process.env`, never hardcoded.
- _Negative cases_ (`invalid-<flow>-data.ts`): array of `{ id, title, overrides | buildPayload, ... }` with a unique `API-NNN` id. New cases use `overrides` or `buildPayload: () => ...`, **not** a ready-made `payload` computed at import time.
- _Controller_: `extends BaseController`; one method = one HTTP call; returns the raw `response`; **no assertions, no `.json()`, no logic**. Paths have no leading `/` (`"api/courses"`). Token passed as `headers: this.authHeaders(accessToken)` from `BaseController`, never a hand-built `authorization` header.
- _Schema_ (`tests/app/json-schemas/`): `z.strictObject`; a `// Response body of METHOD /api/...` comment; exported `type Xxx = z.infer<...>`; fields match the real response.
- _Fixtures_ (`tests/fixtures.ts`): added only when a precondition repeats. A new controller comes as a pair, `xxxController` (on `api`, throws on non-2xx) and `rawXxxController` (on `request`). Preconditions wrapped in `base.step("precondition: ...", ...)`. The `Fixtures` type updated.

**Spec structure:**

- `test` / `expect` imported **only** from `../fixtures`, never from `@playwright/test`.
- Describes: `test.describe("<flow>", ...)` for positive, `test.describe("<flow> - negative scenarios", ...)` for negative; **no tags on describes**. Every `test(...)` has its own tag as the 2nd argument: `{ tag: "@regression" }`, plus `@smoke` only for the main happy path of a resource (`{ tag: ["@regression", "@smoke"] }`); negatives and secondary flows are `@regression` only.
- Titles: `API-NNN: <subject> - should <expectation>`; in a loop `` `${id}: ${title} - should return ${status}` ``. Ids unique and following on from the current highest id.
- Everything inside `test.step(...)`; order request → status (if relevant) → schema → values.
- **Arrange → Act → Assert**:
  - Arrange: fixtures/builders/setup; setup steps prefixed `precondition:`; request data built here, not inside the Act step; no assertions.
  - Act: exactly **one** `test.step` with the request under test.
  - Assert: separate `test.step`s, one check each; no new requests between Act and Assert except a follow-up read that verifies a state change persisted.
  - No `// Arrange` / `// Act` / `// Assert` comments.
- Schema check written exactly as `const result = xxxSchema.safeParse(json); expect(result.error?.issues ?? []).toEqual([]);`.
- Schema check: once per endpoint, in the `@smoke` test. Exception: an endpoint that has different schemas (e.g. `courseDetailSchema` after `courseSchema`).
- Value checks on one object: **more than 2** fields of the same body compared with expected values must be **one** step with one `expect(json).toMatchObject({ ... })` (expected values built once and reused for the response and the follow-up GET), not a row of `expect(json.field).toBe(...)` lines. One or two field checks may stay plain `toBe` / `toContain`; don't flag them. `expect.soft` is not used. A row of 3 or more per-field `toBe` checks is a nit.
- `xxxController` for Arrange and happy paths; `rawXxxController` for the request under test in negatives.
- Negatives: a `for` loop over an array from `test-data/`; a single case with its own precondition (like `API-008`) is a standalone test in the same describe. Each asserts the status **and** the error field the route returns (`error`, `error_description`).
- Status checks: `xxxController` already throws on non-2xx, so in positives a `status code matches 200` step is redundant (flag it), while any other success status (e.g. `201`) **must** be asserted. **Every** negative must have a `status code matches ${status}` step.
- Tests are independent: each creates its own data; no reliance on seed data except `adminCredentials`; no ordering between tests.

**Test value** (the "why does this test exist" check):

- Each test catches a real business risk (main flow → access control → money/data/access rules). If you can't name the risk, flag it.
- No duplicates of existing tests (grep `tests/dojo-courses/` for the route/controller method); no second case from an already covered equivalence class.
- No separate checks for fields the Zod schema already guarantees; assert only values that depend on the request.
- No tests of framework/library behavior (Next.js, Prisma, Zod internals).
- No status-only test where the outcome matters (a change must persist: verify with a follow-up GET, like `update-user.spec.ts`).
- **No unrequested edge cases** (missing keys, exotic formats, boundaries, unicode, oversized bodies). Flag them; the user must have asked for them explicitly.
- With a plan: every planned scenario has a test that checks what the plan expects; nothing from **Not planned** was written. A missing scenario or an expected result that contradicts the plan is a blocker.
- Expected statuses and messages match the plan and the route code, not a guess. If the plan and the route disagree, report it as a finding for the user to decide; don't side with either.

**Test body hygiene** (the line-by-line pass; each item is a finding when it fails):

- Every fixture in a test's arguments is needed by **every** case that runs through that test. A fixture requested only for some cases of a loop (e.g. `userToken` for a case that sends no token, which also registers an extra user per run) is a finding; the fix is to split the case out or to remove the fixture.
- No no-op or redundant code: a filter or condition that can't change the result (e.g. filtering a list of a fresh course by a code that is already unique), a variable used once that only renames another one, a step that repeats the previous one.
- Assertions are as strict as the claim in the title or step name. "Is kept unchanged" must compare the whole object, "is not created" must check the whole list, and a persistence claim must be backed by a follow-up read. Flag a weaker assertion, and flag a title that promises more than the test checks.
- Test data can't make the test flaky or wrong over time (fixed dates, values that may collide between runs or workers, values that depend on the clock within a tiny margin).
- Setup is done through the cheapest existing way (fixtures and builders), not by repeating requests in the test body.
- A scenario's claimed risk is really covered. If the plan says "schema OK" or "nothing was created" for a scenario and the test doesn't check it, that is a finding (or a documented deviation, if the skill's rules say so: name it).

**Hygiene:** no `test.only` / `test.skip` / `test.fixme` left in; no `console.log`, `waitForTimeout`, or commented-out code; no hardcoded URLs, emails or passwords; no `!` non-null assertions or `any` to silence the compiler; no unused imports/exports.

### 4. Consistency pass (across the project)

Compare the change with its siblings and flag every place where it introduces something new instead of copying what exists:

- names: files (`kebab-case`, `<domain>-data.ts`, `invalid-<flow>-data.ts`), exports, fixtures, case-array names, controller methods (verb + noun like `registerUser`, `getToken`);
- structure: describe/tag layout, title format, step wording (`status code matches 400`, `response body matches the ... schema`, `response contains an error message`), case-object keys and their order;
- layering: logic on the wrong layer (data in the spec instead of a builder, a repeated precondition not turned into a fixture, a repeated request not in a controller);
- new helpers, libraries, or patterns where an existing one already covers the task.

When a new file or test is the **second** of its kind and differs from the first, say which one should change and why; don't just write "inconsistent".

When the new code **copies** a sibling that has a flaw, do not accept it as "consistent". Report it as a finding on the new code and name the sibling that has the same flaw, so the user can choose between fixing both and keeping the pattern.

### 5. Decide the verdict and write the outcome

Severity:

- **Blocker**: fix before committing. A wrong or false-passing test (wrong expected status, an assertion that can't fail, a request in the wrong controller), `tsc`/`prettier` errors, duplicate ids, `test.only`, hardcoded secrets, import from `@playwright/test`, tests that depend on each other or on seed data, more than one request in the Act step.
- **Should fix**: breaks a project convention or weakens the test (assertions in a controller, import-time `payload`, missing `precondition:` prefix, missing tags, schema not `strictObject`, a duplicate schema check, status-only where persistence matters, missing error-field check in a negative, a missing status check in a negative or in a positive with a non-200 success status, a redundant `status code matches 200` step, a duplicate or low-value test, an unrequested edge case).
- **Nit**: harmless but inconsistent style and naming (step wording, title phrasing, ordering, 3 or more per-field `toBe` checks instead of one `toMatchObject`).

Padding means findings with no evidence. A small finding that you can tie to a rule above, to the plan, to the route code or to a concrete sibling file is **not** padding and must be reported. A finding you can't tie to any of those is reported only as `unsure`, with what is unclear. Don't suggest new abstractions; prefer the lightest fix that brings the code in line with the existing pattern.

Verdict, one of:

| Verdict                  | When                                                        | Outcome                              |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------ |
| `Ready to commit`        | **zero findings of any severity**, nits and `unsure` included | chat reply only; **no file written** |
| `Ready after nits`       | only Nit or Should-fix findings (the user may commit)       | write the review file                |
| `Fix N blocker(s) first` | at least one Blocker (Should-fix items go in the same file) | write the review file                |

**The review file** (for any verdict except `Ready to commit`):

- Path: `docs/<slug>/review.md`, where `<slug>` is the endpoint's folder, shared with its `plan.md` and `pipeline.md`: `<method>-<resource-path>`, kebab-case, path params dropped (e.g. `docs/patch-admin-users/review.md`, next to `docs/patch-admin-users/plan.md`). Don't name the folder after the spec or the flow; reuse the existing folder. Create the directory if needed. `docs/` is gitignored: this is a working note.
- If the file exists, it is the previous review of the same flow: read it, drop findings that are now fixed, and replace the file. Don't append.
- Use exactly this structure, terse, one fix per checkbox:

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

## Should fix

- [ ] same shape as above

## Nits

- [ ] same shape as above

## Consistency notes

- Where the change diverges from sibling files, and which side should move.

## Pre-existing, not part of this change

- Only if it directly affects the new code; otherwise omit.

## Not checked

- Anything you did not verify (tests not run, a route branch you couldn't compare, a file you skipped) and why. Write "nothing" only if everything was checked.

## Edge cases worth a thought

- One line each, only if noticed. Not findings.

## After fixing

Re-run `tsc`, `prettier --check tests` and the changed spec, then ask for a re-review.
````

Omit empty sections. Every item follows **file:line → what is wrong → why → fix**, never a bare snippet.

## Reply to the user

Reply in the user's language. Keep it short; the details live in the file.

- **Verdict** in one line.
- **Mechanical checks**: one line each for `tsc`, `prettier`, duplicate ids, and whether tests were run.
- **References used**: which of the plan / route code / nearby tests you compared against, and which sibling tests you matched each new test with.
- **Plan coverage** (when there is a plan): one line per planned scenario, `S-id → test ids → covered as planned / deviation (what)`. Every deviation, such as a check the plan lists but the test doesn't make, is also a finding.
- If a file was written: its path, the counts (`N blockers, N should fix, N nits`), and **every** finding as a one-liner linked as `[name](path#Lline)`, nits included. Don't repeat the file's detail.
- **Not checked**: what you did not verify.
- **Edge cases noticed**: one line each, even for `Ready to commit`.
- **Looks good**: one or two lines on what already follows the patterns. This line never replaces a finding.
- `Ready to commit`: say so, that no file was written, and that you found nothing of any severity.

Then offer to apply the fixes from the file; don't apply or commit unless the user says so. When committing, `.md` files go in a separate commit from everything else: CI ignores them (`paths-ignore: "**.md"`), so they must not ride along with test changes.

This skill runs on **Opus with high effort**; the `orchestrate-api-tests` orchestrator passes `model: opus, effort: high`.

## Orchestrated mode

Use this when the prompt says the stage is orchestrated by `orchestrate-api-tests`. Everything above still applies, except:

- **Scope:** the files listed in the prompt count as "paths given by the user".
- **Resume:** a resumed review starts over from step 1. An existing review file is the previous round's review; handle it as step 5 says: drop the fixed items and replace the file. Ticked `- [x]` items were applied by the fix stage; check that each fix is really in the code before dropping it.
- **Reply:** instead of the reply to the user, end with the `STAGE_RESULT` block from the prompt.
  - `verdict`: the verdict.
  - `artifacts`: the review file path, or nothing for `Ready to commit`.
  - `summary`: the mechanical-check results, the counts `N blockers, N should fix, N nits`, the plan coverage (`S-id → test ids`), every finding as a one-liner (blockers, should-fix **and** nits), what was not checked, and the edge cases noticed. The orchestrator relays this summary to the user, so anything left out of it is lost; keep it as long as it needs to be.
  - Don't offer to apply the fixes; the orchestrator decides.
