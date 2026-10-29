---
title: "Running a coding-agent swarm from Orca"
summary: "Two weeks, 1,372 agent spawns, ~160 worktrees and 177 PRs. What Orca is actually good for, the rules I learned the hard way, and a live run with Claude and Codex workers."
date: 2026-10-28
tags: [agents, orca, claude-code, codex, workflow]
draft: true
---

For the last couple of weeks almost all of my engineering output has gone through coding agents. Not one agent in a chat window: dozens at a time, each in its own git worktree, each on its own ticket, with a lead agent routing work between them. I run all of it from [Orca](https://onorca.dev) (by Stably AI), a desktop app that treats worktrees, terminals and agents as first-class objects.

Before writing this I went back through my own transcripts instead of trusting memory. The numbers for **Oct 14 – Oct 28**:

| What | Count |
|---|---|
| Agent transcripts | 2,371 |
| Sub-agents spawned | 1,372 (744 in the background) |
| Messages between agents | 1,174 |
| Scripted workflow runs | 59 |
| Linked git worktrees alive | ~160 across 6 repos |
| PRs opened | 177 (61 on a single day) |
| Shell commands run by agents | ~56,000 |

Going through the data also turned up something I didn't expect. Most of that swarm was **Claude Code's own** machinery: sub-agents, background agents, workflow scripts, named teammates. Orca hosted it. I was barely using Orca's own orchestration layer, and I wasn't using Codex for coding at all. So I ran a proper experiment for this post (section 4). Here is what I'd tell anyone setting this up.

## 1. What Orca is actually for

The value of Orca isn't that it runs agents; every agent CLI does that. The value is that **it makes a swarm observable and addressable**:

- **Every agent pane reports its state.** Orca installs small hooks into Claude Code and Codex (`~/.orca/agent-hooks/claude-hook.sh`, `codex-hook.sh`). Tool calls, stops, permission prompts and prompt submits flow back to the sidebar as status and unread dots. With 9 live panes across 3 repos, "which one is waiting for me" is the only question that matters, and the sidebar answers it.
- **Agent teams render as real panes.** Claude Code's agent-teams feature expects tmux. Orca ships a tmux shim (`~/.orca/claude-agent-teams-bin/tmux`) that turns each teammate into an Orca terminal you can click into, read, or type into.
- **Every session is searchable.** `orca search "<query>"` full-text searches every agent session on the machine (1,937 indexed for me) in tens of milliseconds and prints the exact `claude --resume <id>` line. That answers "which session fixed that flaky test last Tuesday?" in one command.
- **Each worktree gets its own browser.** Orca's embedded browser has worktree-scoped tabs and profiles, so an agent can check its own branch's UI on its own dev server with its own auth session, without fighting over my Chrome.
- **Automations.** A scheduled agent run, e.g. `Platform audit report fixes – Tuesdays 9AM`, that opens a fresh worktree and does the boring sweep without me.

The mental model I settled on: **Orca is the cockpit, git worktrees are the lanes, agents are the drivers.**

## 2. The patterns that actually shipped code

### Lead + per-ticket builders

One long-running lead session owns a queue (a Linear view, a PRD, a review backlog). For each ticket it spawns a builder agent with:

- one ticket → one branch (`<me>/<ticket-id>-<slug>`) → one worktree → one agent;
- a brief written like a contractor's statement of work (more on this below);
- the instruction to open a PR and stop. **Agents open PRs; humans merge.**

### Review-fix rounds as code

When a PR stack gets bot reviews, the lead doesn't fix them itself. It writes a small workflow script that fans out one fixer per stack layer, in parallel, each in that layer's worktree. One stack went through **49 rounds** of this. Every round's script has the same skeleton:

```js
const layers = [{ pr: 101, branch: "me/t-1-prewarm" }, /* ...one per layer */];
await parallel(layers.map((l) => () =>
  agent(`Fix every finding in the latest bot review of PR #${l.pr}.
  First: git fetch && git reset --hard origin/${l.branch} — the pushed head is the truth.
  Read ALL of /tmp/rev/${l.pr}.md, including nits. Touch only this layer's concern.
  Decline a finding only with a concrete reason citing file:line, and record it
  under "Decisions" in the PR body so the next review sees it.
  Run the linter AFTER your last edit and paste its literal output.`)
));
```

### Named lanes with a router

For overnight QA I run lanes: A, B, C, each owning a scarce resource (a simulator, a port, a test account) and a numbered list of work. The lead acts as a router, not a worker: when lane A got auth-blocked it reassigned A's items, and it took items back by message ("Lead here: I'm taking #12 myself, skip it. If you already started, reply with what you published so I don't duplicate"). Three lanes published ~14 screen-by-screen PRD walkthroughs with screenshots in about 90 minutes while I slept.

### Watchers

Long-lived monitors that do one thing: rebuild and reinstall the app when the release branch moves, watch a PR for new review comments, watch main for movement. My rule for them: **a quiet loop is not a reason to stop watching.**

## 3. The rules, each paid for with a real incident

**1. Claim the work by branch, not by ticket status.** Two sessions built the same ticket on the same day because ticket status isn't a lock. Now every builder runs this before writing code, and again right before `gh pr create`:

```bash
git ls-remote origin 'refs/heads/*<ticket-id>*'
gh pr list --search <ticket-id>
```

**2. Diff the file sets before you fan out.** Six "independent" PRs went out in parallel. Three touched the same package, and they conflicted as soon as the first merged. If two tasks share a package, they belong in one stack, not two branches. Start that stack with the first PR (`gh stack`), and never relay SHAs between agents by hand.

**3. Give every lane an exclusive resource, and fence off the stateful one.** A builder was about to install over the simulator that held my signed-in session (nobody wants to re-type OTPs at 3am). The rule now: agents build to their own simulator by UDID, and the signed-in one only ever gets `simctl install`.

**4. Unattended loops never block on a question.** One agent asked me a question at 04:47 and sat idle for eight hours. In a loop, the agent takes the safe default and lists the open decision in its next summary. A product blocker becomes a comment on the ticket, the ticket moves to Hold, and the agent takes the next one.

**5. "Done" means pasted evidence.** An agent reported "lint passes" when lint had failed on the test file it had just written. Now every brief demands the literal output of the check, run after the last edit. Prose claims of green don't count.

**6. The pushed head is the truth.** Bots review what's pushed, and PRs get rebased under you (one got rebased three times in an hour). Every fixer starts with `git reset --hard origin/<branch>`.

**7. Write decisions down where the next reviewer will see them.** Review round 30 would undo round 12. A "Decisions" section in the PR body, plus a rule that a recorded decision stands unless the review brings a new concrete reason, stopped the ping-pong.

**8. Budget the disk.** Every worktree builds at its own path, so build caches don't share. I hit 100% disk with a 235 GB Go build cache, 28 GB of Xcode DerivedData and ~60 worktrees. Write down when a worktree may be removed (merged or closed PR, or a clean tree; archive first), and share compile caches where your toolchain allows.

**9. Check credentials before an unattended launch.** Five red-team lanes all failed at start because the cloud credentials had expired.

**10. Put the house rules in the repo, not the prompt.** `CLAUDE.md` holds the rules every worker inherits for free: fail loudly, parallel-safe tests with no fixed ports and no real sleeps, stack from the first PR, never say "mergeable" without running the pristine check. Hard-won operational lessons go into memory files that briefs can point at.

## 4. Live run: Orca orchestration with Claude and Codex workers

Everything above used Claude's own sub-agents, with Orca as the host. Orca also has a **supervised orchestration** layer: a durable Run with an inbox, Tasks, and Dispatches (one authoritative attempt each), with workers that can be any agent Orca knows about, including Codex. I had never used it seriously, so I used it to build part of this page.

The setup: I (Claude Code, acting as coordinator) had just written the markdown pipeline behind `/writing`. Two workers:

- **Codex** reviews that commit in the same worktree, read-only;
- **Claude** adds an RSS feed and sitemap in a fresh child worktree.

```bash
orca orchestration run-create --objective "Codex reviews writing/, Claude adds RSS + sitemap" --json

orca orchestration worker-start --agent codex --worktree current \
  --task-title "Codex: review writing/ feature" --spec "$REVIEW_SPEC" --json

orca orchestration worker-start --agent claude --worktree new-child --name writing-rss \
  --task-title "Claude: RSS feed + sitemap" --spec "$RSS_SPEC" --json

orca orchestration check --wait --types "worker_done,escalation,question" --timeout-ms 540000 --json
```

Each spec follows Orca's task contract, which turns out to be the same shape my briefs had grown into on their own: **Target, Change, Constraints, Ownership, Observable acceptance.** For example, the Codex one said, in part: *"READ-ONLY review. Do not edit any file in the repository and do not run git commands that change state. You own only the report file. Acceptance: the report exists with a summary line stating how many findings and the highest severity."*

What came back:

| | Codex (review) | Claude (build) |
|---|---|---|
| Wall time | ~60 s | ~60 s, including a full `next build` |
| Result | 2 findings, both medium | commit `3c080f7`: RSS route, sitemap, `<link rel=alternate>` |
| Evidence | report with file:line and failure scenarios | literal route table from the build |

Both of Codex's findings were real, and one would have bitten me on day one. Post dates like `2026-10-28` were parsed as midnight UTC and then formatted in the build machine's timezone, so from my PDT laptop every post would have shown the previous day. The other: a missing or malformed date rendered "Invalid Date" or crashed the prerender. Both are fixed: dates stay as calendar days and are formatted in UTC, and a bad date now fails the build with the filename.

The Claude worker caught something about Orca itself: `--worktree new-child` branched from the old branch tip (`081e26e`), not from my fresh local commit. It noticed, fast-forwarded, and said so in `worker_done`. The lesson is to **pass `--base-branch` explicitly** whenever the coordinator has local commits the child needs.

Things I liked about the supervised mode, compared to plain sub-agents:

- **Settlement is explicit.** A worker sends exactly one `worker_done` with `--outcome succeeded|failed`, and the coordinator then has to *decide* what happens to that terminal: reuse it, retain it, or release it. `worker-list --terminal-state reclaimable` showing zero is a real "nothing is left running" check, and I didn't have that before.
- **Absence isn't failure.** A wait timeout is a checkpoint. "I can't see the process" is `unverifiable`, not `exited`. That is precisely the discipline I'd been trying to beat into lead agents in prose.
- **Mixed models are trivial.** `--agent codex` vs `--agent claude` is one flag. Using a different model family as the reviewer is the cheapest way I know to avoid "the author graded its own homework".

Where I'll use which from now on:

- **Claude sub-agents / workflow scripts**: high fan-out, same-model, short-lived work (review-fix rounds, research sweeps), where the parent wants the result back in its own context.
- **Orca orchestration**: long-lived or cross-model work, whenever I want each worker visible as a pane, durable inbox semantics, and an explicit cleanup ledger. A Codex reviewer on every Claude-built PR is the first thing going in.

## 5. A starter kit

If you're starting from one agent in one terminal, do this in order:

1. One ticket → one branch → one worktree → one agent. Name the branch after the ticket.
2. Write briefs as **Target / Change / Constraints / Ownership / Observable acceptance**. Include the exact path, the exact branch, "reset to the pushed head first", and "paste literal output".
3. Run the duplicate check (`git ls-remote` + `gh pr list --search`) before building and before opening the PR.
4. Overlapping files mean one stack. Stack from the first PR.
5. Give every parallel lane its own simulator, port and test account. Fence off the stateful ones in writing.
6. Unattended means no blocking questions: safe default, note on the ticket, next.
7. Agents open PRs. Humans merge.
8. Use a different model family as the reviewer.
9. Watch the disk.
10. Let Orca do what it's uniquely good at: pane status, `orca search`, per-worktree browsers, automations, and supervised runs when you need a ledger.

The swarm doesn't remove the engineering. It moves it into the briefs, the guardrails and the review. Writing those well is now most of my job, and I'm fine with that.
