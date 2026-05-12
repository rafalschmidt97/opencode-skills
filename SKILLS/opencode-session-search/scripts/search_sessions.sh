#!/usr/bin/env bash
# Search OpenCode sessions by keyword across titles, messages, and parts.
# Usage: search_sessions.sh <keyword> [--deep] [--limit N] [--since YYYY-MM-DD]
#
# --deep    Also search the `part` table (tool outputs, file contents). Slower but thorough.
# --limit   Max results per layer (default: 20)
# --since   Only return sessions created after this date

set -euo pipefail

DB="${OPENCODE_DB:-$HOME/.local/share/opencode/opencode.db}"

if [[ ! -f "$DB" ]]; then
  echo "ERROR: OpenCode database not found at $DB" >&2
  exit 1
fi

KEYWORD=""
DEEP=false
LIMIT=20
SINCE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --deep) DEEP=true; shift ;;
    --limit) LIMIT="$2"; shift 2 ;;
    --since) SINCE="$2"; shift 2 ;;
    *) KEYWORD="$1"; shift ;;
  esac
done

if [[ -z "$KEYWORD" ]]; then
  echo "Usage: search_sessions.sh <keyword> [--deep] [--limit N] [--since YYYY-MM-DD]" >&2
  exit 1
fi

SINCE_CLAUSE=""
if [[ -n "$SINCE" ]]; then
  SINCE_MS=$(date -j -f "%Y-%m-%d" "$SINCE" "+%s" 2>/dev/null || date -d "$SINCE" "+%s" 2>/dev/null)
  if [[ -n "$SINCE_MS" ]]; then
    SINCE_CLAUSE="AND s.time_created >= ${SINCE_MS}000"
  fi
fi

echo "=== Layer 1: Session titles & directories ==="
sqlite3 -header -column "$DB" "
SELECT s.id, s.title, s.directory,
       datetime(s.time_created/1000, 'unixepoch', 'localtime') as created,
       CASE WHEN s.parent_id IS NOT NULL AND s.parent_id != '' THEN 'subagent' ELSE 'top-level' END as type
FROM session s
WHERE (s.title LIKE '%${KEYWORD}%' OR s.directory LIKE '%${KEYWORD}%')
      ${SINCE_CLAUSE}
ORDER BY s.time_created DESC
LIMIT ${LIMIT};
"

echo ""
echo "=== Layer 2: Message content ==="
sqlite3 -header -column "$DB" "
SELECT s.id, s.title, s.directory,
       datetime(s.time_created/1000, 'unixepoch', 'localtime') as created,
       CASE WHEN s.parent_id IS NOT NULL AND s.parent_id != '' THEN 'subagent' ELSE 'top-level' END as type
FROM session s
JOIN message m ON s.id = m.session_id
WHERE m.data LIKE '%${KEYWORD}%'
      ${SINCE_CLAUSE}
GROUP BY s.id
ORDER BY s.time_created DESC
LIMIT ${LIMIT};
"

if [[ "$DEEP" == "true" ]]; then
  echo ""
  echo "=== Layer 3: Tool outputs (parts) ==="
  sqlite3 -header -column "$DB" "
  SELECT s.id, s.title, s.directory,
         datetime(s.time_created/1000, 'unixepoch', 'localtime') as created,
         CASE WHEN s.parent_id IS NOT NULL AND s.parent_id != '' THEN 'subagent' ELSE 'top-level' END as type
  FROM session s
  JOIN part p ON s.id = p.session_id
  WHERE p.data LIKE '%${KEYWORD}%'
        ${SINCE_CLAUSE}
  GROUP BY s.id
  ORDER BY s.time_created DESC
  LIMIT ${LIMIT};
  "
fi
