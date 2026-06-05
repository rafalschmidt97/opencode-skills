---
name: slack-dm-sender
description: >-
  Send Slack direct messages through the web UI using headed agent-browser, with
  the human logged in interactively. Supports a single person or batching the
  same message to many people one by one without creating a group chat. USE FOR:
  send a Slack DM, send a message to X on DM, message these people on Slack,
  DM this update to a list of people, send the same Slack message to multiple
  recipients, batch Slack DMs, team communication update, stakeholder update,
  notify people individually on Slack. DO NOT USE FOR: Slack API, Slack bots,
  webhooks, desktop Slack automation, channel announcements, group chats, emails,
  calendar invites.
compatibility: >-
  Requires agent-browser installed with Chrome/Chromium access. Requires Slack
  workspace access through the web UI and a human completing login in the headed
  browser when needed. Uses Slack web only; no Slack API, bot token, webhook, or
  desktop app.
metadata:
  author: community
  version: "1.0"
allowed-tools: Bash(agent-browser:*) Bash(npx agent-browser:*)
---

# Slack DM Sender

## Overview

Use this skill to send direct messages in Slack through the web application with
`agent-browser --headed`. The workflow intentionally acts like a human using the
browser: the user logs in, the agent searches for one recipient, verifies the DM,
types the message, sends it, and repeats for the next recipient.

This is for team communication where the same update must be sent privately to
many people, for example rollout updates, ownership follow-ups, stakeholder
notices, or action requests.

Do not use Slack API, webhooks, bot tokens, or the Slack desktop app. If Slack
shows the app-launch interstitial, click **open this link in your browser**.

## Prerequisites

1. `agent-browser` is installed and Chrome/Chromium can open headed windows.
2. The user can log into the target Slack workspace in the browser window.
3. The user provided:
   - Recipient name or list of names.
   - Exact message text.
   - Optional Slack DM URL for the first recipient.

If the message text is missing, ask for it before opening Slack. If a recipient
name is ambiguous, ask the user to choose before sending.

## Safety Rules

1. Send only through Slack web in a headed browser.
2. Do not use Slack API, bot tokens, webhooks, CLI Slack clients, or desktop app automation.
3. For batches, create separate 1:1 DMs. Never create a multi-person DM or group chat.
4. Verify the recipient before sending by checking the conversation header or composer label.
5. If search returns multiple plausible people, stop and ask the user which one to use.
6. If a send fails, record the failure and continue only if the next recipient is independent.
7. Never infer recipients from partial names when the result is unclear.
8. Preserve the user's exact message text unless they explicitly ask you to edit it.

## Start The Browser

Use a stable saved session name so Slack cookies/local storage are restored across
commands and usually across agent restarts:

```bash
agent-browser --session-name slack-web --headed open "https://app.slack.com"
```

If the user gave a direct DM URL, open it instead:

```bash
agent-browser --session-name slack-web --headed open "<workspace-slack-url>/archives/<DM_ID>"
```

Then inspect the page:

```bash
agent-browser --session-name slack-web snapshot -i
```

If Slack shows a login page, tell the user to complete login in the opened
browser and wait for confirmation. If Slack shows a launch page, click the link
named **open this link in your browser** and continue.

## Single Recipient Workflow

Use this when the user asks for one DM, for example: "Send a message to Jane
Smith on DM: test message from opencode".

1. Open Slack web in the `slack-web` headed session.
2. If a DM URL was provided, open it directly and skip to recipient verification.
3. Otherwise click **New message**.
4. Search the recipient by the full name provided by the user.
5. Select the exact person result, not a channel and not a group DM.
6. Verify the target by checking one of these:
   - Conversation header contains the expected person.
   - Composer placeholder says `Message to <person or username>`.
   - Recent DM history visibly belongs to the expected person.
7. Fill the message composer with the exact message text.
8. Verify **Send now** is enabled.
9. Click **Send now**.
10. Re-snapshot and verify the sent message appears in the DM history.

Prefer accessibility refs from `snapshot -i`. Re-snapshot after every page change
because refs become stale.

## Batch Workflow

Use this when the user provides multiple recipients, especially 20+ people.

### 1. Build The Batch Table

Before sending, normalize the request into a table and show it to the user if any
part is ambiguous:

```text
Message to send:
[exact message]

Recipients:
1. [Full name 1]
2. [Full name 2]
3. [Full name 3]
...
```

If the user gave a clear list and exact message, proceed without asking for a
second confirmation. If the user gave mixed formatting, aliases, or incomplete
names, ask for clarification before sending.

### 2. Process One Person At A Time

For each recipient:

1. Click **New message**.
2. Search the recipient by full name.
3. Select exactly one person result.
4. Verify the composer/header targets that one person.
5. Fill the same message text.
6. Click **Send now**.
7. Verify the message appears in that DM.
8. Record status before moving to the next recipient.

Do not keep adding recipients in the `To:` field. After selecting one person and
sending, start a fresh **New message** flow for the next recipient. This avoids a
group DM and keeps every message private.

### 3. Track Progress

Maintain a compact status list while sending:

```text
Progress:
1. Jane Smith - sent
2. Alex Johnson - sent
3. Jan Kowalski - ambiguous search result, needs user choice
```

For 20+ recipients, report progress in small batches, for example every 5 sends
or when a failure occurs. The final response must include counts:

```text
Sent: 18
Skipped/needs clarification: 2
Failed: 0
```

## Finding Recipients Reliably

The safest path is Slack's **New message** recipient picker because it searches
people directly.

Useful commands:

```bash
agent-browser --session-name slack-web snapshot -i
agent-browser --session-name slack-web click @e25
agent-browser --session-name slack-web fill @e68 "Full Name"
agent-browser --session-name slack-web snapshot -i
```

Refs vary by session. If the exact refs above do not exist, use the current
snapshot and target elements by their labels:

```bash
agent-browser --session-name slack-web find role button click --name "New message"
agent-browser --session-name slack-web find role combobox fill --name "To:" "Full Name"
```

When the search result shows both username and display name, prefer the exact
full-name match requested by the user. Example: for `Jane Smith`, select the
result that displays a matching username and `Jane Smith`.

## Handling Login And Slack Interstitials

If login is required:

1. Stop automation.
2. Tell the user: "Please complete Slack login in the opened browser window."
3. Continue only after the user confirms login is complete.

If Slack tries to open the desktop app:

1. Snapshot the page.
2. Click **open this link in your browser**.
3. Wait for the web UI.
4. Continue with the DM workflow.

## Error Handling

| Situation | Action |
|---|---|
| Login page appears | Ask user to log in in the headed browser, then continue. |
| Desktop app launch page appears | Click **open this link in your browser**. |
| Recipient search has no result | Mark recipient as failed/no result and ask user for another identifier. |
| Multiple plausible recipients | Stop for that recipient and ask user to choose. |
| Composer targets a group or multiple people | Do not send; clear/reset and restart the single-recipient flow. |
| Send button disabled | Re-check message text, focus composer, and verify recipient is selected. |
| Message send not visible after click | Wait briefly, re-snapshot, and verify before moving on. |
| Slack rate-limits or UI becomes unstable | Pause, report current progress, and ask whether to continue later. |

## Final Response Format

For one recipient:

```text
Sent `[message preview]` to [recipient] via Slack web DM.
```

For a batch:

```text
Slack DM batch complete.
Sent: [N]
Skipped/needs clarification: [N]
Failed: [N]

Details:
1. [Recipient] - sent
2. [Recipient] - sent
3. [Recipient] - ambiguous, needs clarification: [reason]
```

Keep details factual. Do not include private message contents beyond a short
preview unless the user needs the exact audit trail.
