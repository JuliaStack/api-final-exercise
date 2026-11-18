---
name: review-api-tests
description: Use before committing new or changed Playwright API tests in `tests/` to review them against the project's best practices and check they are consistent with the rest of the suite. Never edits tests or commits; when the verdict is not "Ready to commit" it writes the fixes to a markdown file in `docs/test-reviews/`. Triggers on "review my tests", "check the tests before commit", "are my tests consistent", "review API tests", "code review the tests", "перевір тести перед комітом", "зроби рев'ю тестів", "чи відповідають тести патернам проєкту". Checks the layers (types → test-data → controller → json-schema → fixture → spec), spec structure (Arrange → Act → Assert, steps, tags, ids), test value (critical business risk, no duplicates, no unrequested edge cases) and cross-file consistency. The rules come from the `create-api-tests` skill.
model: sonnet
effort: high
---

# Reviewing API tests before commit

Review tests the way the project's author would: does each new or changed test follow the suite's patterns, protect a real business risk, and look like it was written by the same person as its neighbours?

This skill **only reviews**. It never edits files under `tests/`, never stages, never commits. Its one output besides the chat reply is a review file in `docs/test-reviews/` (see step 5). The user decides what to fix.

`create-api-tests` is the source of truth for the rules. The checklist below is a condensed copy; if a rule is unclear or the two disagree, read `.claude/skills/create-api-tests/SKILL.md`. The code in `tests/` wins over `docs/` (which may lag).

## Scope: what to review

1. **Paths given by the user** → review exactly those.
2. **Otherwise the uncommitted work under `tests/`:**
   ```bash
   git status --short tests
   git diff HEAD -- tests
   ```
   Untracked files don't show in `git diff`; read them in full. If nothing is changed under `tests/`, say so and stop.
3. Review **only changed lines** for rule violations. Existing code the change didn't touch is not a finding, even if it breaks a rule. Mention it once under "Pre-existing, not part of this change" only if it directly affects the new code (e.g. the new case copies a legacy pattern).

## Workflow

### 1. Build context (don't skip)

- Read each changed file in full, then its **siblings in the same layer** (other specs, other `test-data/` files, the controller, the schema file, `tests/fixtures.ts`). Consistency can only be judged against them.
- For every spec under review, open the route it hits in `src/app/api/...` (and `src/lib/validations/`) to check that expected statuses and error fields match what the code really returns.

### 2. Run the mechanical checks

```bash
npx tsc --noEmit
npx prettier --check tests
grep -rhoE "API-[0-9]+" tests | sort | uniq -d     # duplicate test ids: must print nothing
```

If the user asks, or the change is small, also run the changed specs (`BASE_URL=http://localhost:3000/ npx playwright test <file>` for a local server; the default `BASE_URL` is a remote training server). If tests were not run, say so plainly. Don't claim they pass.

### 3. Review against the checklist

**Layers** (each depends only on the ones below it; only what's needed was added):

- _Types_ (`tests/app/types/`): a base `XxxFields` type, derived via `Pick` / `Partial`; no `any`; no duplicated shapes.
- _Data_ (`tests/app/test-data/<domain>-data.ts`): `buildXxxData()` builders with faker; uniqueness via `getRandomNumber()`; secrets and credentials from `process.env`, never hardcoded.
- _Negative cases_ (`invalid-<flow>-data.ts`): array of `{ id, title, overrides | buildPayload, ... }` with a unique `API-NNN` id. New cases use `overrides` or `buildPayload: () => ...`, **not** a ready-made `payload` computed at import time.
- _Controller_: `extends BaseController`; one method = one HTTP call; returns the raw `response`; **no assertions, no `.json()`, no logic**. Paths have no leading `/` (`"api/courses"`). Token passed as `headers: { authorization: \`Bearer ${token}\` }`.
- _Schema_ (`tests/app/json-schemas/`): `z.strictObject`; a `// Response body of METHOD /api/...` comment; exported `type Xxx = z.infer<...>`; fields match the real response.
- _Fixtures_ (`tests/fixtures.ts`): added only when a precondition repeats. A new controller comes as a pair, `xxxController` (on `api`, throws on non-2xx) and `rawXxxController` (on `request`). Preconditions wrapped in `base.step("precondition: ...", ...)`. The `Fixtures` type updated.

**Spec structure:**

- `test` / `expect` imported **only** from `../fixtures`, never from `@playwright/test`.
- Describes: `test.describe("<flow>", { tag: ["@regression", "@smoke"] }, ...)` for positive, `test.describe("<flow> - negative scenarios", { tag: "@regression" }, ...)` for negative.
- Titles: `API-NNN: <subject> - should <expectation>`; in a loop `` `${id}: ${title} - should return ${status}` ``. Ids unique and following on from the current highest id.
- Everything inside `test.step(...)`; order request → status (if relevant) → schema → values.
- **Arrange → Act → Assert**:
  - Arrange: fixtures/builders/setup; setup steps prefixed `precondition:`; request data built here, not inside the Act step; no assertions.
  - Act: exactly **one** `test.step` with the request under test.
  - Assert: separate `test.step`s, one check each; no new requests between Act and Assert except a follow-up read that verifies a state change persisted.
  - No `// Arrange` / `// Act` / `// Assert` comments.
- Schema check written exactly as `const result = xxxSchema.safeParse(json); expect(result.error?.issues ?? []).toEqual([]);`.
- `xxxController` for Arrange and happy paths; `rawXxxController` for the request under test in negatives.
- Negatives: a `for` loop over an array from `test-data/`; a single case with its own precondition (like `API-008`) is a standalone test in the same describe. Each asserts the status **and** the error field the route actually returns (`error`, `error_description`).
- Tests are independent: each creates its own data; no reliance on seed data except `adminCredentials`; no ordering between tests.

**Test value** (the "why does this test exist" check):

- Each test catches a real business risk (main flow → access control → money/data/access rules). If you can't name the risk, flag it.
- No duplicates of existing tests (grep `tests/dojo-courses/` for the route/controller method); no second case from an already covered equivalence class.
- No separate checks for fields the Zod schema already guarantees; assert only values that depend on the request.
- No tests of framework/library behavior (Next.js, Prisma, Zod internals).
- No status-only test where the outcome matters (a change must persist: verify with a follow-up GET, like `update-user.spec.ts`).
- **No unrequested edge cases** (missing keys, exotic formats, boundaries, unicode, oversized bodies). Flag them; the user must have asked for them explicitly.
- Expected statuses and messages match the route code, not a guess.

**Hygiene:** no `test.only` / `test.skip` / `test.fixme` left in; no `console.log`, `waitForTimeout`, or commented-out code; no hardcoded URLs, emails or passwords; no `!` non-null assertions or `any` to silence the compiler; no unused imports/exports.

### 4. Consistency pass (across the project)

Compare the change with its siblings and flag every place where it introduces something new instead of copying what exists:

- names: files (`kebab-case`, `<domain>-data.ts`, `invalid-<flow>-data.ts`), exports, fixtures, case-array names, controller methods (verb + noun like `registerUser`, `getToken`);
- structure: describe/tag layout, title format, step wording (`status code matches 400`, `response body matches the ... schema`, `response contains an error message`), case-object keys and their order;
- layering: logic on the wrong layer (data in the spec instead of a builder, a repeated precondition not turned into a fixture, a repeated request not in a controller);
- new helpers, libraries, or patterns where an existing one already covers the task.

When a new file or test is the **second** of its kind and differs from the first, say which one should change and why; don't just write "inconsistent".

### 5. Decide the verdict and write the outcome

Severity:

- **Blocker**: fix before committing. A wrong or false-passing test (wrong expected status, an assertion that can't fail, a request in the wrong controller), `tsc`/`prettier` errors, duplicate ids, `test.only`, hardcoded secrets, import from `@playwright/test`, tests that depend on each other or on seed data, more than one request in the Act step.
- **Should fix**: breaks a project convention or weakens the test (assertions in a controller, import-time `payload`, missing `precondition:` prefix, missing tags, schema not `strictObject`, status-only where persistence matters, missing error-field check in a negative, a duplicate or low-value test, an unrequested edge case).
- **Nit**: harmless but inconsistent style and naming (step wording, title phrasing, ordering).

Don't pad the report. Skip a finding you can't tie to a rule above or to a concrete sibling file. Don't suggest new abstractions; prefer the lightest fix that brings the code in line with the existing pattern.

Verdict, one of:

| Verdict                | When                       | Outcome                                    |
| ---------------------- | -------------------------- | ------------------------------------------ |
| `Ready to commit`      | no findings (or none that need a change) | chat reply only; **no file written** |
| `Ready after nits`     | only Nit or Should-fix findings (the user may commit) | write the review file |
| `Fix N blocker(s) first` | at least one Blocker (Should-fix items go in the same file) | write the review file |

**The review file** (for any verdict except `Ready to commit`):

- Path: `docs/test-reviews/<flow>.md`, kebab-case, named after the main spec or flow reviewed (e.g. `update-user.md`). Create the directory if needed. `docs/` is gitignored, which is fine: the file is a working note, not a deliverable.
- If the file exists, it is the previous review of the same flow: read it first, drop findings that are now fixed, and replace the file. Don't append.
- Use exactly this structure, terse, one fix per checkbox:

````markdown
---
verdict: Fix 2 blocker(s) first
reviewed: 2026-11-18
files:
  - tests/dojo-courses/update-user.spec.ts
  - tests/app/test-data/update-user-data.ts
---

# Review: update user

## Mechanical checks

- `npx tsc --noEmit`: pass / fail (paste the errors)
- `npx prettier --check tests`: pass / fail (list the files)
- duplicate ids: none / `API-0NN`
- tests run: not run / N passed / failures (paste the output)

## Blockers

- [ ] **`tests/dojo-courses/x.spec.ts:42`** — what is wrong.
      **Why:** the risk or the rule it breaks (name the sibling file it should match).
      **Fix:** the smallest change; a short snippet only if it isn't obvious.

## Should fix

- [ ] same shape as above

## Nits

- [ ] same shape as above

## Consistency notes

- Where the change diverges from sibling files, and which side should move.

## Pre-existing, not part of this change

- Only if it directly affects the new code. Otherwise omit the section.

## Edge cases worth a thought

- One line each, only if noticed. These are not findings.

## After fixing

```bash
npx tsc --noEmit
npx prettier --check tests
npx playwright test <changed spec>
```

Then ask for a re-review.
````

Omit empty severity sections. Every item uses **file:line → what is wrong → why → fix**, so a fix is never a bare snippet.

## Reply to the user

Reply in the language the user writes in (Ukrainian if they write Ukrainian). Keep it short; the details live in the file.

- **Verdict** in one line.
- **Mechanical checks**: one line each for `tsc`, `prettier`, duplicate ids, and whether tests were run.
- If a file was written: its path, the counts (`N blockers, N should fix, N nits`), and the blockers as one-liners, each linked as `[name](path#Lline)`. Don't repeat the whole file.
- **Looks good**: one or two lines on what already follows the patterns, so the user knows it was checked.
- If the verdict is `Ready to commit`: say so, and that no file was written.

Then offer to apply the fixes from the file. Don't apply them, and don't commit, unless the user says so. When committing, `.md` files always go in a separate commit from everything else: CI ignores them (`paths-ignore: "**.md"` in `.github/workflows/playwright.yaml`), so they must not ride along with test changes.

## Model
This skill runs on **Sonnet with high effort**; the `orchestrate-api-tests` orchestrator passes `model: sonnet, effort: high` to the subagent.

## Orchestrated mode

Use this when the prompt says the stage is orchestrated by `orchestrate-api-tests`. Everything above still applies, except:

- **Scope:** the files listed in the prompt count as "paths given by the user".
- **Resume:** a resumed review starts over from step 1. An existing review file is the previous round's review; handle it as step 5 says: drop the fixed items and replace the file. Ticked `- [x]` items were applied by the fix stage; check that each fix is really in the code before dropping it.
- **Reply:** instead of the reply to the user, end with the `STAGE_RESULT` block from the prompt.
  - `verdict`: the verdict.
  - `artifacts`: the review file path, or nothing for `Ready to commit`.
  - `summary`: the mechanical-check results, the counts `N blockers, N should fix, N nits`, and the blockers as one-liners.
  - Don't offer to apply the fixes; the orchestrator decides.
