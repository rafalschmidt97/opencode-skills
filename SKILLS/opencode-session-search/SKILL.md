---
name: opencode-session-search
description: Search and retrieve OpenCode session history to find which session and directory was used for a specific task. Use this skill whenever the user mentions past sessions, asks where they worked on something, wants to find a session by PR URL, branch name, commit message, topic, repo name, or any keyword. Also trigger when the user wants to recall recent activity, trace back where a change was made, find which directory they were in, or look up what they did on a particular date. Even if the user doesn't say "session" explicitly -- if they're asking "where did I do X", "when did I work on Y", "find the PR I made for Z", or "what was I doing last week", this skill applies.
---

# OpenCode Session Search

Every OpenCode session is recorded in a local SQLite database at `~/.local/share/opencode/opencode.db`. This skill helps you query it to answer questions about past work.

## Why this matters

Users frequently forget which directory or worktree they used for a task, especially when working across many repos and branches. The session database captures everything -- the working directory, a title summary, all messages, and all tool outputs (including git commands, PR creation, file edits). This makes it possible to find any past session if you know even a fragment of what happened in it.

## Quick start

A bundled helper script handles the most common search pattern. Run it directly:

```bash
bash <skill-path>/scripts/search_sessions.sh "keyword" --deep --limit 10
```

The `--deep` flag searches tool outputs (the `part` table), which is slower but finds things like PR URLs and branch names that don't appear in titles or messages.

For more targeted searches or when you need to trace parent/child session relationships, use the SQL queries below directly via `sqlite3`.

## Database structure

The database path is `~/.local/share/opencode/opencode.db`. Key tables and columns:

| Table | Key columns | What it stores |
|-------|------------|----------------|
| `session` | `id`, `title`, `directory`, `parent_id`, `time_created` | Each session. `title` is an auto-generated summary. `directory` is where OpenCode ran. `parent_id` links subagent sessions to their parent. |
| `message` | `session_id`, `data` (JSON) | Full conversation turns -- user prompts and assistant responses. |
| `part` | `session_id`, `message_id`, `data` (JSON) | Tool call results -- command outputs, file contents, API responses. This is where PR URLs, branch names, and detailed outputs live. |
| `project` | `id`, `worktree`, `name` | Git worktrees registered as projects. |
| `workspace` | `id`, `branch`, `project_id`, `directory` | Workspace/branch associations. |

All timestamps are **epoch milliseconds**. Convert with `datetime(time_created/1000, 'unixepoch', 'localtime')`.

## Search strategy

Search in layers, starting fast and going deeper only if needed. Run independent layers in **parallel** to save time.

### Layer 1: Titles and directories (instant)

Session titles are short auto-generated summaries like "Draft PR proposing fix for issue #7" or "Fix FormatCheck errors". They're the fastest to search and often sufficient.

```sql
SELECT id, title, directory,
       datetime(time_created/1000, 'unixepoch', 'localtime') as created,
       parent_id
FROM session
WHERE title LIKE '%keyword%' OR directory LIKE '%keyword%'
ORDER BY time_created DESC LIMIT 20;
```

### Layer 2: Message content (fast)

Messages contain user prompts and assistant text as JSON. Useful when the keyword appeared in conversation but not the title.

```sql
SELECT s.id, s.title, s.directory,
       datetime(s.time_created/1000, 'unixepoch', 'localtime') as created,
       s.parent_id
FROM session s JOIN message m ON s.id = m.session_id
WHERE m.data LIKE '%keyword%'
GROUP BY s.id ORDER BY s.time_created DESC LIMIT 20;
```

### Layer 3: Tool outputs / parts (slower, most thorough)

The `part` table stores tool call results -- this is where PR URLs, `gh pr create` commands, git output, and file contents are stored. This table can be large, so set a timeout (30s+) on these queries.

```sql
SELECT s.id, s.title, s.directory,
       datetime(s.time_created/1000, 'unixepoch', 'localtime') as created,
       s.parent_id
FROM session s JOIN part p ON s.id = p.session_id
WHERE p.data LIKE '%keyword%'
GROUP BY s.id ORDER BY s.time_created DESC LIMIT 20;
```

### Triangulation

For specific targets like a PR, search multiple angles in parallel:

- **PR URL fragment**: `%repo-name/pull/57%`
- **Branch name**: `%fix/skip-resource-type%`
- **Issue reference**: `%platform-jvm-project#7%`
- **Function/class names** from the change: `%getStorageAccountName%`

The more specific the keyword, the faster and more accurate the results.

## Understanding results

### Subagent sessions

OpenCode spawns subagent sessions for Task tool calls. These have `parent_id` set, pointing to the session the user was actually interacting with.

When you find a session with a non-empty `parent_id`, trace up to the top-level session:

```sql
SELECT id, title, directory,
       datetime(time_created/1000, 'unixepoch', 'localtime') as created
FROM session WHERE id = '<parent_id>';
```

Also look for sibling subagent sessions to show the full picture:

```sql
SELECT id, title, datetime(time_created/1000, 'unixepoch', 'localtime') as created
FROM session WHERE parent_id = '<parent_id>'
ORDER BY time_created ASC;
```

### Directory

The `directory` column is the working directory where OpenCode was launched. This answers "which directory was I in" directly.

## Common query patterns

**Recent sessions in a specific directory:**
```sql
SELECT id, title, datetime(time_created/1000, 'unixepoch', 'localtime') as created
FROM session WHERE directory LIKE '%directory-name%'
ORDER BY time_created DESC LIMIT 10;
```

**What did I work on today / this week:**
```sql
SELECT id, title, directory,
       datetime(time_created/1000, 'unixepoch', 'localtime') as created
FROM session
WHERE parent_id IS NULL OR parent_id = ''
  AND time_created > (strftime('%s', 'now', '-7 days') * 1000)
ORDER BY time_created DESC;
```

**All top-level sessions (exclude subagents):**
```sql
SELECT id, title, directory,
       datetime(time_created/1000, 'unixepoch', 'localtime') as created
FROM session
WHERE parent_id IS NULL OR parent_id = ''
ORDER BY time_created DESC LIMIT 30;
```

**Distinct directories used recently:**
```sql
SELECT DISTINCT directory, MAX(datetime(time_created/1000, 'unixepoch', 'localtime')) as last_used
FROM session GROUP BY directory ORDER BY time_created DESC LIMIT 30;
```

## Output format

Report results as a clear summary including:

1. **Session ID** -- for reference
2. **Title** -- the auto-generated summary
3. **Directory** -- where the session ran
4. **Date/time** -- when it was created
5. **Parent session** -- if this is a subagent, who spawned it
6. **Child sessions** -- any subagent sessions spawned from it
