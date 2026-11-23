---
name: orchestrate-api-tests
description: Use when the user hands over an endpoint of the Dojo API (e.g. "POST /api/courses/{id}/purchase", a route file, or a resource name) and wants the whole test development done end to end, or wants to resume an interrupted run. Decides whether a test plan is needed, then runs `plan-endpoint-tests` (if needed) → `create-api-tests` → `review-api-tests` (+ up to 2 automatic fix rounds) as subagents, reports after each stage, and keeps a resumable state file `docs/<slug>/pipeline.md`. Triggers on "orchestrate tests for {endpoint}", "full pipeline for {endpoint}", "take {endpoint} from plan to review", "resume the test pipeline", "/orchestrate-api-tests resume", "проведи ендпоінт через увесь цикл", "зроби тести під ключ", "продовж пайплайн". Never commits.
model: sonnet
effort: high
---

# Orchestrating test development for one endpoint

You are the orchestrator. You talk to the user, decide what runs next, and keep the state file. You **don't** analyze in depth, write tests, or review yourself: each stage runs in a subagent that loads its own skill. You never commit.

One pipeline is for **one method of one route**.

## Stages

| Stage           | Skill                         | Agent `model` | Agent `effort` | Input                                          | Output (artifact)                         |
| --------------- | ----------------------------- | ------------- | -------------- | ---------------------------------------------- | ----------------------------------------- |
| plan (optional) | `plan-endpoint-tests`         | `opus`        | `high`         | endpoint + route file                          | `docs/<slug>/plan.md`                     |
| create          | `create-api-tests`            | `sonnet`      | `high`         | plan file, or the endpoint if there is no plan | changed files under `tests/`              |
| review          | `review-api-tests`            | `sonnet`      | `high`         | the files create changed + plan file (if any)  | verdict (+ `docs/<slug>/review.md`)     |
| fix-1, fix-2    | `create-api-tests` (fix mode) | `sonnet`      | `high`         | review file                                    | changed files under `tests/`              |

The model and effort per stage are fixed by the user. Always pass them to the Agent tool, even when resuming.

`<slug>` is the plan file name: `<method>-<resource-path>`, kebab-case, path params dropped (e.g. `post-courses-purchase`).

## Workflow

### 0. Start or resume

- **The input is "resume"** (or no endpoint is given): list `docs/*/pipeline.md` whose table has a stage that is not `done`/`skipped`. If there is one, take it. If there are several, ask which one. If there are none, say so and stop. Then go to **Resuming** below.
- **An endpoint is given:** resolve it (step 1), compute `<slug>`, and check `docs/<slug>/pipeline.md`. If it exists with unfinished stages, show its table and ask: continue from where it stopped, or start over? Starting over resets the table; it never deletes test files.

### 1. Resolve the endpoint

Map the input to a route file under `src/app/api/**/route.ts` and an HTTP method (read the exported `GET`/`POST`/... handlers).

- **Exactly one method of one route:** go on.
- **A resource name, a route with several methods, or several matching routes:** list every candidate as `METHOD /api/path` and ask the user to pick one (AskUserQuestion). Don't pick for them and don't queue the rest. If they want several, run one full pipeline, then ask about the next.

### 2. Triage: is a plan needed?

Read only the route handler, its validation schema (`src/lib/validations/`), and `grep -rn "<route path>" tests/` for existing coverage. Don't read more; deep analysis is the plan stage's job.

| Plan needed if **any** of these is true                                    | Skip the plan if **all** of these are true              |
| -------------------------------------------------------------------------- | ------------------------------------------------------- |
| `requireAdmin`, an ownership check, or the outcome depends on role × state | only `requireAuth`, or a public route                   |
| 3 or more distinct error statuses                                          | 2 or fewer error branches                               |
| side effects: money, price, promo codes, counters, related records         | a read, or a single-row write                           |
| state gates (`isPublished`, `isActive`, `expiresAt`, ...)                  | no lifecycle                                            |
| no existing coverage, so a new controller / schema / fixtures are needed   | it extends an existing spec (e.g. a few more negatives) |

Tell the user the decision in one line with the reason, e.g. `Plan: yes (requireAdmin + 4 error branches + promo side effects)`. Don't wait for an answer. If the user said "no plan" or "with plan", that wins over the table.

### 3. Create the state file

Write `docs/<slug>/pipeline.md` (create the directory if needed; `docs/` is gitignored, which is fine):

```markdown
---
endpoint: POST /api/courses/{courseId}/purchase
route: src/app/api/courses/[courseId]/purchase/route.ts
plan_needed: true (requireAdmin + 4 error branches + promo side effects)
started: 2026-11-18
---

# Pipeline: POST /api/courses/{courseId}/purchase

| Stage  | Status  | Artifact | Agent id | Checkpoint |
| ------ | ------- | -------- | -------- | ---------- |
| plan   | pending |          |          |            |
| create | pending |          |          |            |
| review | pending |          |          |            |
| fix-1  | pending |          |          |            |
| fix-2  | pending |          |          |            |

## Log

- 2026-11-18 triage: plan needed (requireAdmin + 4 error branches + promo side effects)
```

Statuses: `pending`, `in_progress`, `done`, `interrupted`, `needs_user`, `blocked`, `skipped`. If no plan is needed, mark `plan` as `skipped`. Update the row **before** starting a stage (`in_progress` + agent id) and right after its result arrives. Add one Log line per event (stage done, interrupted, resumed, user decision). The create subagent updates the `Checkpoint` cell itself.

### 4. Run a stage

Start a subagent with the Agent tool: `subagent_type: "general-purpose"`, plus the `model` and `effort` from the Stages table, and this prompt (fill in the `<...>`):

```text
You are running one stage of the test pipeline, orchestrated by `orchestrate-api-tests`.

Load the `<skill>` skill with the Skill tool and follow it, in its "Orchestrated mode".
Stage: <stage>
Endpoint: <METHOD /api/path>   Route file: <route>
State file: docs/<slug>/pipeline.md
Input: <plan file path | "no plan, analyze the endpoint yourself" | files to review + plan file path, or "no plan" | review file to apply>
Resume: <no | yes: the previous attempt stopped at checkpoint "<checkpoint>"; files already written: <list>. These are your own unfinished work: continue from the first unfinished item, don't redo or overwrite finished work.>
User notes: <scope, edge cases the user asked for, answers to earlier questions, or "none">

You cannot talk to the user. If you need a decision from them, stop and return status needs_user with the question.
End your reply with exactly this block (nothing after it):

STAGE_RESULT
stage: <stage>
status: done | partial | needs_user | blocked
artifacts: <comma-separated paths you created or changed>
checkpoint: <create/fix only: the layer checklist, e.g. "types ✓ data ✓ controller ✓ schema ☐ fixtures ☐ spec ☐ verify ☐">
verdict: <review only: Ready to commit | Ready after nits | Fix N blocker(s) first>
summary: <3–5 lines: what was done, key results>
question: <only when needs_user: the question for the user, with the options>
```

Run stages one at a time, never in parallel. The subagent runs in the background: wait for its completion notification and never guess its result.

### 5. Handle the result

Read the `STAGE_RESULT` block and act on `status`:

| Situation                                                                                      | What you do                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `done`                                                                                         | Mark the row `done`, fill Artifact, report to the user (see below), go to the next stage or gate.                                                                                                                                                                                                  |
| `needs_user`                                                                                   | Mark `needs_user`, ask the user the `question` (AskUserQuestion), then pass the answer back to **the same agent** with SendMessage (load it via ToolSearch `select:SendMessage` if needed). If the agent can no longer be reached, start a new one in resume mode with the answer in "User notes". |
| `partial`, **no `STAGE_RESULT` block**, or the Agent call failed (e.g. a token or usage limit) | The stage was interrupted. Mark it `interrupted`, save the checkpoint (from the block, or from the state file the subagent kept updating), tell the user in one line where it stopped, and resume it (see **Resuming**).                                                                           |
| `blocked`                                                                                      | Mark `blocked`, tell the user what blocks it (e.g. the route doesn't exist, the remote server is down, `tsc` fails for a reason outside `tests/`), and stop until they decide.                                                                                                                     |

### 6. Gates and the order of stages

```text
triage ──plan needed──▶ plan ──▶ GATE 1 ──▶ create ──▶ review ──▶ fix loop ──▶ GATE 2 (final report, stop)
       └─no plan────────────────▶ create (returns needs_user with its scenarios = GATE 1)
```

- **Gate 1, scenarios** (stop and wait for the user):
  - With a plan: show the plan file path, the scenarios as `S-id: title (risk)`, what was left out, and the open questions. Ask to confirm or adjust. Pass any adjustments to create in "User notes".
  - Without a plan: create runs its own discovery and returns `needs_user` with its scenario list; that question is Gate 1. Send the answer back with SendMessage.
- **Create → review:** no stop. Report create's result in a few lines and start review straight away with create's `artifacts` as the files to review, plus the plan file path if there is one.
- **Fix loop** (automatic, up to 2 rounds, no stop):
  - Verdict `Ready to commit`: no fix loop. Mark `fix-1` and `fix-2` as `skipped`.
  - Verdict `Ready after nits` with **only nits** in the review file: no fix loop. Mark both fix rows `skipped`; the user can ask for the nits later.
  - Otherwise (blockers or should-fix items): run `fix-1` (create in fix mode, input = the review file), then review again. If the verdict still needs fixes, run `fix-2`, then review a last time. Never run a third round.
  - Each fix round and re-review gets a one-line progress report; don't wait for the user.
- **Gate 2, final report** (stop): see below. Then the pipeline is finished.

## Resuming

The state file is the source of truth. Try these in order:

1. **Same session, the agent is still reachable** (its id is in the state file): SendMessage to it: `Continue the <stage> stage from where you stopped. Same rules; end with the STAGE_RESULT block.` Its context is intact.
2. **The agent can't be reached:** start a new subagent for the same stage with `Resume: yes`, the checkpoint from the state file, and the artifacts already written. Same `model` and `effort`.
3. **New session** (e.g. after a usage limit; the user runs `/orchestrate-api-tests resume` or gives the same endpoint): read the state file, show its table, ask "continue from <stage>?", then use option 2.

Resuming per stage:

- **plan:** rerun it with `Resume: yes`; if the plan file exists it is the stage's own draft.
- **create / fix:** resume from the checkpoint. The subagent checks `git status --short tests` against the checkpoint, because files on disk win over the checklist.
- **review:** rerun it from the start; it writes its file only at the end.

Before resuming, if `git status` shows changes under `tests/` that no stage in the state file produced, list them and ask whether they belong to this pipeline.

If the same stage is interrupted twice in a row at the same checkpoint, don't loop: report it and ask the user how to proceed.

## Reporting to the user

Reply in the language the user writes in. Report after **every** stage, short, without repeating what the files say:

- **After plan (Gate 1):** plan path, scenarios `S-id: title (risk)`, not planned, open questions → "Confirm or adjust the scenarios."
- **After create:** each changed file with one line on what was added; the `API-NNN` ids assigned; the `tsc` / `prettier` / playwright results as reported (if tests weren't run, say so). Then "Starting review."
- **After each review:** the verdict; counts `N blockers, N should fix, N nits`; the review file path; the next step (fix round N, or the final report).
- **Final report (Gate 2):**
  - the final verdict;
  - the changed files;
  - the review file, if any is left;
  - what is still open after 2 fix rounds;
  - the edge cases noted by the stages (one line each, not implemented);
  - anything that was interrupted and resumed.

  Remind the user that nothing was committed, and that `.md` files always go in a separate commit from everything else: CI ignores them (`paths-ignore: "**.md"` in `.github/workflows/playwright.yaml`), so they must not ride along with test changes.

Never claim tests pass unless a stage reported that it ran them and they passed.

## Rules

- Never commit, stage, or push. Never edit `tests/` yourself; changes come only from the create stage.
- Don't merge endpoints into one pipeline, and don't start the next endpoint without asking.
- Don't add stages, skills, or checks that aren't listed here.
- Edge cases are implemented only if the user asked for them; pass that request in "User notes" to every stage.
