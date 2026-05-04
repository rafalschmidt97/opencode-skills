# notify

Time-based notification routing for OpenCode. Uses macOS native notifications during work hours and push notifications via [ntfy.sh](https://ntfy.sh) after hours.

Forked from `kdco/notify` with added features:
- Schedule-based channel routing (local / push / silent)
- Push notifications via ntfy.sh (no dependencies, just HTTP POST)
- Screen lock detection: sends push even during "local" hours if Mac is locked
- Weekend override channel
- Two-file config: base (tracked) + local secrets (untracked)

## Setup

1. Copy `notify.ts` to `~/.config/opencode/plugins/notify.ts`
2. Copy `kdco-notify.json` to `~/.config/opencode/kdco-notify.json`
3. Create `~/.config/opencode/kdco-notify.local.json` with your ntfy topic:

```json
{
  "push": {
    "topic": "your-secret-topic"
  }
}
```

4. Install the [ntfy app](https://ntfy.sh) on your phone and subscribe to the same topic.

Or use the repo's `install.sh` to symlink automatically.

## Config

`kdco-notify.json` (safe to commit):

```json
{
  "mode": "schedule",
  "weekendChannel": "local",
  "pushWhenLocked": true,
  "schedule": [
    { "start": "06:00", "end": "09:00", "channel": "push" },
    { "start": "09:00", "end": "17:00", "channel": "local" },
    { "start": "17:00", "end": "22:00", "channel": "push" },
    { "start": "22:00", "end": "06:00", "channel": "silent" }
  ],
  "push": {
    "service": "ntfy",
    "sshHint": "open blink and write \"ssh w\"",
    "clickUrl": "ssh://w"
  },
  "sounds": {
    "idle": "Glass",
    "error": "Basso",
    "permission": "Submarine",
    "question": "Submarine"
  }
}
```

`kdco-notify.local.json` (secrets, NOT committed):

```json
{
  "push": { "topic": "your-secret-topic" }
}
```

The local file is deep-merged over the base config. Config is hot-reloaded on every event (no restart needed).

## Modes

- `"schedule"` -- routes notifications based on time-of-day slots
- `"local"` -- always uses macOS native notifications (original behavior)

## Channels

- `"local"` -- macOS native notification (suppressed when terminal is focused)
- `"push"` -- ntfy.sh push notification to phone
- `"silent"` -- no notification

## Dependencies

Requires `node-notifier` and `detect-terminal` in `~/.config/opencode/package.json` (installed by OCX primitives).
