---
title: "Mobile-first coding: a phone, a relay, and a rack of Mac minis"
summary: "My agents don't live on my laptop any more. They run for hours on Mac minis, and I steer them from my phone through Orca's relay. How to set it up both ways, what runs on the minis, and the rules that keep a 24/7 swarm sane."
date: 2026-10-28
tags: [agents, orca, claude-code, codex, mobile, workflow]
draft: false
---

Most of my coding now happens from my phone.

Not typing code on a phone keyboard. That would be miserable. My agents run on Mac minis on the company network, each one working in its own git worktree on its own ticket, and my phone is the remote control. It buzzes when an agent needs a permission, has a question, or opens a PR. I approve, answer, read the diff, kick off the next ticket, or merge, from wherever I am. The tool that makes this work is [Orca](https://onorca.dev).

I went back through the logs before writing this. In the **last 8 days my phone received about 2,400 agent notifications** from Orca, and they don't follow office hours:

| Pacific time | Notifications |
|---|---|
| 00:00 – 06:00 | 412 |
| 06:00 – 12:00 | 568 |
| 12:00 – 18:00 | 774 |
| 18:00 – 24:00 | 680 |

Every hour of the day has activity, including the ones I spend asleep. Over the last two weeks Orca recorded **1,911 agent starts**, and the agents behind them opened **177 PRs**.

## Why the agents moved off my laptop

I tried the obvious version first: Claude's mobile app talking to the agents on my laptop. It works, but only while the laptop is open, awake and online. Close the lid on the way to a meeting and the swarm stops.

Orca's **relay** removes that dependency. The agents run on machines that never sleep, and the phone talks to those machines directly, from anywhere, without opening ports and without the laptop in the loop. The laptop becomes just another client, so I can close it and nothing stops.

```
   phone (Orca mobile)                     laptop (Orca desktop)
          │  end-to-end encrypted                  │
          ▼                                        ▼
   ┌─────────────── relay.onorca.dev ────────────────┐
   └───────┬──────────────────┬──────────────────┬───┘
           ▼                  ▼                  ▼
     mac-mini-1          mac-mini-2         mac-mini-3
     orca serve          orca serve         orca serve
     ├ worktrees         ├ simulators       ├ watchers
     ├ claude / codex    ├ QA lanes         ├ automations
     └ review loops      └ ...              └ ...
```

The relay is a rendezvous point, not a place your code lives. Pairing sets up an end-to-end-encrypted binding between the device and the runtime, and Orca picks the closest relay region by latency.

## Setting it up, way 1: phone → each Mac mini directly

This is the setup for long-lived work. Each mini runs a headless Orca runtime, and the phone pairs with each one.

**1. Run Orca headless on the mini.**

```bash
orca serve --mobile-pairing
```

`orca serve` starts the runtime without a desktop window, prints the bound endpoint and a pairing code, and listens on port 6768 by default (it moves to another port if that one is taken). If the phone and the mini share a network, such as an office LAN or Tailscale, advertise that address so the phone can connect directly when it's close by:

```bash
orca serve --mobile-pairing --pairing-address <mini's LAN or Tailscale address>
```

Everywhere else, the relay handles reachability. I leave the phone's connection mode on **automatic**: direct when it can be, relay when it can't.

**2. Pair the phone.** Scan the pairing code with the Orca mobile app. Each mini then shows up as its own machine, with its own worktrees, terminals and agents. Name them; "mac-mini-2" is a lot easier to deal with at 2am than an IP address.

**3. Keep it running.** A headless runtime is only useful if it's always up. On each mini:

- **Run it as a LaunchAgent**, so it starts at login and restarts if it dies. Put a plist in `~/Library/LaunchAgents/` with `RunAtLoad` and `KeepAlive` set to true, whose `ProgramArguments` call `orca serve --mobile-pairing --port 6768`. Use a fixed port so pairings survive restarts.
- **Stop it sleeping:** `sudo pmset -a sleep 0 disksleep 0`, plus `sudo pmset -a autorestart 1` so it comes back after a power cut.
- **Log in the agent CLIs once, on the mini itself** (`claude`, `codex login`), along with `gh` and any cloud credentials. Five of my overnight lanes once failed at start because cloud credentials had expired. Check auth before you walk away.

## Setting it up, way 2: the laptop as the hub

Sometimes I want my laptop to drive the minis: to fan work out to them from a coordinator session, or to search their sessions from the terminal I'm already in. In that case the laptop pairs with each mini as a saved **environment**:

```bash
# on the mini: start the runtime and copy its pairing code
orca serve

# on the laptop: save it once
orca environment add --name mac-mini-2 --pairing-code 'orca://pair?code=…'
orca environment list
```

After that, any `orca` command can target the mini:

```bash
orca worktree list --environment mac-mini-2
orca search "flaky simulator test" --environment mac-mini-2   # search is per host; there is no all-machines search
orca terminal switch --environment mac-mini-2 --terminal <handle>  # jump the desktop UI to that pane
```

Supervised workers can also run on the mini while the coordinator stays on the laptop:

```bash
orca orchestration worker-start --on mac-mini-2 --worktree new-top-level \
  --repo <repo on the mini> --name eng-1234 --agent claude --setup run --spec "$SPEC" --json
```

The Run and its inbox stay with the coordinator, and the worker executes on the mini. From then on you address it by Dispatch ID, never by the mini's terminal handle.

### Which way when

- **Way 1 (phone → mini)** is for anything that must outlive my laptop session: overnight QA, watchers, long review loops, automations. Nothing in that path depends on the laptop being awake.
- **Way 2 (laptop → mini)** is for when I'm at a desk and want a coordinator to spread work across machines, or to grep a mini's history.

I use both, every day. The phone pairs with every mini, and the laptop pairs with them too. One gotcha with way 2: if an agent on the mini is using a page in the *laptop's* embedded browser, the page dies when the laptop sleeps. For unattended work, create browser pages on the server side so they run with no desktop attached.

## What actually runs on the minis

The minis host everything that takes longer than a cup of coffee:

- **Lead + per-ticket builders.** One long-running lead session owns a queue (a Linear view, a PRD, a review backlog) and spawns a builder per ticket: one ticket → one branch → one worktree → one agent.
- **Review-fix rounds.** When a stack of PRs gets bot reviews, the lead writes a small workflow script that fans out one fixer per stack layer, in parallel. One stack went through **49 rounds** of this.
- **Overnight simulator lanes.** Lanes A, B and C each own an iOS simulator and a numbered list of PRD screens to walk and document. Three lanes published ~14 screen-by-screen walkthroughs with screenshots in about 90 minutes while I slept. (I wrote up the voice-testing side of this [separately](/writing/voice-ios-testing-with-claude).)
- **Watchers.** Rebuild and reinstall the app when the release branch moves, watch a PR for new review comments, watch main for movement.
- **Automations.** Scheduled agent runs, such as a weekly platform-audit sweep every Tuesday at 9am, each in a fresh worktree.

At peak that meant ~160 live git worktrees across 6 repos and 61 PRs opened in a single day.

## What I do from the phone

Everything a human should still do, and nothing an agent can do instead:

- **Approve permission prompts.** These are most of the buzzes.
- **Answer questions.** When an agent genuinely needs a product decision, it asks and I reply in the pane.
- **Start agents.** A new ticket comes in, I open the right mini, start an agent in a new worktree, and paste the ticket.
- **Read diffs.** On a phone you read a diff skeptically, which turns out to be the right way to read an agent's diff.
- **Merge.** Agents open PRs; humans merge. The phone makes "human merges" cheap enough that I never feel tempted to let an agent do it.

## The rules that keep a 24/7 swarm sane

Each of these cost me something before I wrote it down.

1. **Claim work by branch, not by ticket status.** Two sessions once built the same ticket. Before writing code and again before opening the PR: `git ls-remote origin 'refs/heads/*<ticket-id>*'` and `gh pr list --search <ticket-id>`.
2. **Diff the file sets before fanning out.** Six "independent" PRs conflicted because three of them touched the same package. Shared files mean one stack; start it with the first PR (`gh stack`).
3. **Give every lane its own scarce resource, and fence off the stateful one.** One simulator per lane, by UDID. The simulator holding a signed-in session only ever gets `simctl install`.
4. **Unattended means no blocking questions.** An agent once asked me something at 04:47 and idled for eight hours. In loops the agent takes the safe default, records the open decision, and moves on. The phone helps with this, but it's not an excuse to block.
5. **"Done" means pasted evidence.** An agent reported a green lint run that had actually failed. Every brief now demands the literal output of the check, run after the last edit.
6. **The pushed head is the truth.** Every fixer starts with `git reset --hard origin/<branch>`, because PRs get rebased under you.
7. **Record decisions in the PR body.** A "Decisions" section stops review round 30 from undoing round 12.
8. **Budget the disk.** Each worktree builds at its own path, so caches don't share. I hit 100% once, with a 235 GB Go build cache. Write down when a worktree may be removed, and share compile caches where you can.
9. **Put the house rules in the repo.** `CLAUDE.md` holds what every worker should inherit (fail loudly, parallel-safe tests, stack from the first PR), and memory files hold the operational lessons.

## Live run: Claude and Codex workers under Orca supervision

Most of the swarm above is Claude Code's own sub-agents and workflow scripts, running on the minis. Orca also has a **supervised orchestration** layer: a durable Run with an inbox, Tasks, and Dispatches (one authoritative attempt each), with workers that can be any agent, Codex included. I used it to build part of this page:

```bash
orca orchestration run-create --objective "Codex reviews writing/, Claude adds RSS + sitemap" --json
orca orchestration worker-start --agent codex  --worktree current   --spec "$REVIEW_SPEC" --json
orca orchestration worker-start --agent claude --worktree new-child --name writing-rss --spec "$RSS_SPEC" --json
orca orchestration check --wait --types "worker_done,escalation,question" --timeout-ms 540000 --json
```

Each spec follows Orca's contract, **Target / Change / Constraints / Ownership / Observable acceptance**, which is the same shape my briefs had grown into on their own.

| | Codex (review) | Claude (build) |
|---|---|---|
| Wall time | ~60 s | ~60 s, including a full `next build` |
| Result | 2 findings, both medium | RSS route, sitemap, feed `<link>` |
| Evidence | file:line + failure scenario | literal route table from the build |

Both of Codex's findings were real. Post dates were parsed as UTC midnight and then formatted in the build machine's timezone, so every post would have shown the previous day on my Pacific-time laptop. And a missing date crashed the prerender. The Claude worker noticed that `--worktree new-child` had branched from the old tip instead of my fresh local commit, fixed it, and said so in its report. The lesson: **pass `--base-branch` explicitly.**

What I like about this mode is that settlement is explicit. Each worker sends exactly one `worker_done`, the coordinator has to decide what happens to its terminal, and `worker-list --terminal-state reclaimable` returning zero is a real "nothing is left running" check. Timeouts are checkpoints and "can't see it" is `unverifiable`, not `exited`, and that's the discipline you want on machines you aren't looking at. Add `--on mac-mini-2` and the same loop runs on a mini. Using a Codex reviewer on Claude-built PRs is the cheapest way I know to avoid an author grading its own homework.

## Starter kit

1. Get a Mac mini (or any always-on Mac). Run `orca serve --mobile-pairing` under a LaunchAgent, with sleep disabled.
2. Pair your phone with it. Pair your laptop too, as an `orca environment`, if you want to coordinate from a desk.
3. Log in `claude`, `codex` and `gh` on the mini itself.
4. One ticket → one branch → one worktree → one agent.
5. Brief like a contractor: Target / Change / Constraints / Ownership / Observable acceptance, plus "reset to the pushed head" and "paste literal output".
6. Give each lane its own simulator, port and test account.
7. Let the phone handle the human parts: approvals, answers, diffs, merges.
8. Watch the disk.

The best thing about this setup isn't speed. It's that the work no longer stops when I close my laptop, and the only part that still needs me fits on a phone screen.
