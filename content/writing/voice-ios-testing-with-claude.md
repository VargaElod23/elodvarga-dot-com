---
title: "Teaching Claude to talk to my iOS app"
summary: "An automated voice-to-voice QA loop for a voice-first iOS assistant: macOS `say` into the simulator mic, structured logs as ground truth, Claude as the judge, and parallel simulator lanes overnight."
date: 2026-10-27
tags: [agents, ios, voice, testing, claude-code, orca]
draft: false
---

The product I'm working on is a voice-first assistant with an iOS app. You talk to it; it books things, sets reminders, finds people to fix your house. Text-level evals cover the model, but they never hear the app. They don't catch the speech-to-text mishearing you, the card that flashes for half a second, or the session that drops after fifteen minutes.

So I built a loop where **Claude talks to the app out loud on an iOS simulator, reads what the app heard and did, checks the backend, and files the bugs**. It's about 390 lines of bash plus one slash command. Its first rounds found a real safety bug that the text evals had missed.

## The loop

```
worktree of the iOS app (release branch or PR head)
  → xcodebuild build -destination id=<SIM_UDID>
  → simctl install + launch           (sign-in survives reinstall)
  → simctl spawn <udid> log stream    → stream.log
  → tap layer opens a conversation     (Xcode MCP / AXe / orca emulator)
  → say -r 165 "<line>"                Mac speaker → Mac mic → simulator mic
  → read only the NEW log lines: transcript, cards, tool steps, room id
  → backend: agent logs by room id, DB row exists
  → screenshot + PASS / FAIL / NOT CHECKED with a quote
  → Linear comment, Slack summary, cleanup
```

Each piece is boring on its own. The value is in two design choices.

## Design choice 1: the app's log is the test oracle

I didn't build a second audio pipeline to record and transcribe what the app says back. The app already knows exactly what it heard and what it said, so I made it **log that in a structured, greppable vocabulary** under one `os_log` subsystem (lines trimmed and anonymised):

```
role=user isFinal=true chars=41 text="Remind me to call the insurance company tomorrow."
role=assistant text="Done — I'll remind you tomorrow at 9."
ui received card=task
status started step=create_task
status ended   step=create_task status=ok
result card change=task(id: "…")
room=voice-3d04…
```

With that, the harness is just reading a log:

```bash
xcrun simctl spawn "$SIM_UDID" log stream --level debug --style compact \
  --predicate 'subsystem == "com.example.app.dev"' > stream.log
```

The heart of the kit, `ask.sh`, is about ten lines. It records the log length, speaks, waits, and prints only what happened *after* the utterance:

```bash
start=$(( $(wc -l < "$STREAM_LOG") + 1 ))
say -r "${SAY_RATE:-165}" ${SAY_VOICE:+-v "$SAY_VOICE"} ${SAY_AUDIO_DEVICE:+-a "$SAY_AUDIO_DEVICE"} "$1"
sleep "${2:-16}"
tail -n +"$start" "$STREAM_LOG" \
  | grep -E 'isFinal=true|ui received|status (started|ended)|result card|room=voice-'
```

Short answers get 16 s; anything that books or texts someone gets 25–35 s. The `room=` id is the bridge to the backend: Claude searches the voice agent's logs by room id in Datadog to see the agent's side of the same conversation, then confirms in a read-only dev DB that the task or booking really exists. "She said it" isn't the same as "it was stored", so the test requires both.

A sibling script, `askseq.sh`, runs `ask.sh` in the background while taking a simulator screenshot every 0.5 s, to catch UI cards that appear and vanish.

## Design choice 2: Claude is the judge, with strict rules

The cases are plain markdown, "Say / Check" pairs:

```markdown
Say: "Remind me to call the insurance company tomorrow."  [16]
Check: a task card appears; status ended step=create_task status=ok;
       the reply names tomorrow.
```

A `/voice-test` slash command in `.claude/commands/` turns Claude into the tester, and most of it is **house rules**:

- Dev environment only. Fictional phone numbers only (`555-01XX`, spoken digit-grouped so STT survives: "5 5 5, 0 1 4 2").
- Never type credentials. A human signs in once; the session survives reinstalls.
- Never run `xcodebuild test` on the voice simulator, because it installs the test host over the app.
- Wait for the session to restore before judging "signed out". The sign-up screen flashes for 3–8 s on launch, so `fresh.sh` waits for a `restored session` log line plus 10 s.
- Every verdict is **PASS / FAIL / NOT CHECKED** with a quoted line from the assistant and a piece of evidence.
- **If the transcript is garbled, the case is NOT CHECKED (audio), not FAIL.** Retry once, slower. Never round NOT CHECKED up to PASS.
- Device interaction goes through a sub-agent, so accessibility-tree dumps don't flood the main context.
- Clean up what you created. Never post to Slack or merge on your own.

A typical round report reads like: *4 of 8 pass, 2 fail, 1 not checked*, where each failure carries a quote, a room id and a screenshot, and links to a ticket.

## What it found

The best result came from a *mishearing*. In one case the user says, mid-booking, that water is pouring through the ceiling. Over acoustic loopback, speech-to-text heard "**Ward** is pouring", and the assistant carried on choosing a provider instead of treating it as an emergency. That's a FAIL on the safety case, and it's also a gift. The garbled transcript is exactly what real users in real kitchens will produce. The bug was filed with the room id and the misheard text. A fix agent wrote the fix **plus a regression test using the exact garbled transcript**, and it was review-ready in about a day.

Other catches: a day-only task rendering as "No date" (an agent was spawned to fix it on the spot), and voice sessions killed by the backend after 900 s of provider inactivity. That one was only findable because the room id in the app log led straight to the agent's logs.

Mishearings are now a test input, not just noise. Every interesting garble gets converted into a text-level eval case in the agent's CI suite, which runs 180 eval runs per pass with 3 repeats per case.

## Going wide: parallel simulator lanes

Once one simulator worked, the next step was obvious. For a full pass over everything in the "Testing" column, a lead Claude session wrote a shared `qa-brief.md` and launched **six background lane agents**: iOS, AI/voice, web (Playwright), and three backend lanes. The prompts that made it work:

- *"You own simulator X only."* Every lane gets its own simulator UDID. The signed-in voice simulator is fenced: `simctl install` only, never build-install, never sign out.
- *"Check the dev build contains each fix before testing it."* This version gate kills a whole class of false FAILs.
- *"Keep your `qa-log-<lane>.md` current."* The lead reads the logs; I read the lead.
- *"On FAIL, @-mention the implementer."*

The same lane pattern later walked every screen of two PRD versions overnight, documenting each step with screenshots in Notion. Three simulator lanes produced ~14 walkthroughs in about 90 minutes.

## Everything that broke

| Symptom | Cause | Fix |
|---|---|---|
| Claude can't type into the app | the Xcode device-interaction tool had no text-entry command (it tried `kbd`, `k`, `s`, then grepped the framework binary for one) | made **voice** the input channel; later added AXe `type` for plain fields |
| Taps "succeed", nothing happens | known AXe issue on Xcode 27 / iOS 27: the HID daemon drops the first gesture | `AXE_HID_STABILIZATION_MS=300`, each tap wrapped in `axe batch --step tap --step "sleep 0.8"`; or use an iOS 26.5 simulator |
| Tap hits the wrong "Assistant" | accessibility label not unique | filter by `--element-type Button`, use ids, or tap the AX frame centre |
| `prepareAudioCapture failed: Timed out` | a Zoom call was holding the audio device | Claude detected Zoom (`pgrep`), read the volume (`osascript`), and **asked before speaking out loud** |
| Speech garbled | acoustic loopback in a real room | NOT CHECKED + slower retry; keep the garble as test data; BlackHole (`SAY_AUDIO_DEVICE="BlackHole 2ch"`) for noisy rooms or overnight runs |
| Agents trampling each other's installs | shared simulator | one lane, one UDID, enforced in the brief |
| App reset mid-test | `xcodebuild test` on the voice sim | hard rule: tests run on a different simulator |

The general lesson: when the agent hits a wall in a test harness, let it *tell* you about the wall instead of quietly working around it. The "no typing" wall is the reason voice became the primary input, and that turned out to be the more honest test anyway.

## Where Orca fits

Orca hosts all of this: the lanes run on always-on Mac minis, each one a pane I can watch [from my phone](/writing/orca-coding-agent-swarms), every worktree's build is isolated, and `orca search` finds any past test session in milliseconds. Its emulator commands weren't part of the rounds above (those used Xcode's tools and AXe). They are the tap layer I'm moving to, because they cover exactly the part that broke the most:

```bash
orca emulator attach <udid> --json        # ~5.6 s; makes it the worktree's active device
orca emulator ax --json                   # ~1.9 s; accessibility tree, frames normalized 0..1
orca emulator tap 0.5 0.82 --json         # tap at an element's frame centre
orca emulator type "hello@example.com" --json
orca emulator kill --json                 # leaves the simulator booted
```

Two properties matter for agents. Coordinates are **normalized 0..1 with a top-left origin**, so the frame centre from `ax` (`x + w/2, y + h/2`) is directly tappable on any device size. And the device is **scoped to the worktree**, so lane B's commands can't land on lane A's phone by accident. The live device also shows up in an Orca pane next to the agent's terminal, which makes watching a lane at 2am much less painful. I've only probed it read-only so far, so that part is still on the to-do list.

## Still manual

Being honest about the edges:

- Signing in, deliberately. The agent never sees credentials.
- Microphone permission dialogs, the first time.
- Simulating a third party's SMS reply in booking flows. A human triggers it through a dev admin endpoint.
- A quiet room, until BlackHole is in the default setup.
- Writing the cases. Claude judges them; it doesn't invent them.
- Real telephony. This tests the app, not a phone call.

## Replicate it

1. Reserve a simulator for voice QA. Boot it, sign in once by hand, grant the mic.
2. Have your app **log structured voice events** under one subsystem: final transcript with role, assistant text, UI card, tool step start/end, session/room id. This is 80% of the work and 100% of the value.
3. Write `stream.sh`, `fresh.sh` (wait for "session restored") and `ask.sh` (snapshot line count → `say` → sleep → new lines only).
4. Write cases as Say / Check pairs with per-line waits.
5. Add a `/voice-test` command with house rules: dev only, fictional numbers, PASS / FAIL / NOT CHECKED with quotes, garbled = NOT CHECKED, fresh conversation per case, clean up.
6. Give Claude read access to backend logs (by room id) and a read-only DB, so verdicts rest on what was stored, not only what was said.
7. Pick a tap layer (Xcode device tools, AXe, or `orca emulator`) and route it through a sub-agent.
8. Scale out with lanes: one simulator per agent, a shared brief, a log file per lane, and a version gate before each test.
9. Turn every interesting mishearing into a regression test.

The whole kit is small enough to read in one sitting, and that's deliberate. It's the kind of harness an agent can understand, extend and debug itself, which is what lets it run while I sleep.
