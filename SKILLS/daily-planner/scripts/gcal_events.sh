#!/usr/bin/env bash
# gcal_events.sh — Fetch Google Calendar events for a given day
# Usage: ./gcal_events.sh <calendar_id> <date> [timezone] [quota_project]
#
# Arguments:
#   calendar_id  - Calendar ID (e.g., "primary" or "user@example.com")
#   date         - Date in YYYY-MM-DD format
#   timezone     - Timezone (default: Europe/Warsaw)
#   quota_project - Google Cloud project for quota (optional)
#
# Requires: gcloud CLI with application-default credentials
#   gcloud auth application-default login \
#     --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/calendar.readonly
#
# Output: JSON array of events with extracted fields

set -euo pipefail

CALENDAR_ID="${1:?Usage: gcal_events.sh <calendar_id> <date> [timezone] [quota_project]}"
DATE="${2:?Usage: gcal_events.sh <calendar_id> <date> [timezone] [quota_project]}"
TIMEZONE="${3:-Europe/Warsaw}"
QUOTA_PROJECT="${4:-}"

# Validate date format
if ! [[ "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo '{"error": "Invalid date format. Use YYYY-MM-DD"}' >&2
  exit 1
fi

# Get access token
ACCESS_TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null) || {
  echo '{"error": "Failed to get access token. Run: gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/calendar.readonly"}' >&2
  exit 1
}

# Build time range (full day in the specified timezone)
TIME_MIN="${DATE}T00:00:00"
TIME_MAX="${DATE}T23:59:59"

# URL-encode calendar ID
ENCODED_CAL_ID=$(printf '%s' "$CALENDAR_ID" | jq -sRr @uri)

# Build request URL
URL="https://www.googleapis.com/calendar/v3/calendars/${ENCODED_CAL_ID}/events"
URL+="?timeMin=$(printf '%s' "$TIME_MIN" | jq -sRr @uri)"
URL+="&timeMax=$(printf '%s' "$TIME_MAX" | jq -sRr @uri)"
URL+="&timeZone=$(printf '%s' "$TIMEZONE" | jq -sRr @uri)"
URL+="&singleEvents=true"
URL+="&orderBy=startTime"
URL+="&maxResults=50"

# Build headers
HEADERS=(-H "Authorization: Bearer $ACCESS_TOKEN")
if [[ -n "$QUOTA_PROJECT" ]]; then
  HEADERS+=(-H "x-goog-user-project: $QUOTA_PROJECT")
fi

# Fetch events
RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" "$URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "{\"error\": \"API returned HTTP $HTTP_CODE\", \"body\": $(echo "$BODY" | jq -c '.' 2>/dev/null || echo "\"$BODY\"")}" >&2
  exit 1
fi

# Extract and format events
echo "$BODY" | jq --arg tz "$TIMEZONE" '[
  .items[] | {
    id: .id,
    title: (.summary // "(No title)"),
    start: (.start.dateTime // .start.date),
    end: (.end.dateTime // .end.date),
    all_day: (.start | has("date") and (has("dateTime") | not)),
    location: (.location // null),
    description: (.description // null),
    conference_link: (
      (.conferenceData.entryPoints[]? | select(.entryPointType == "video") | .uri) //
      (.description // "" | capture("(?<url>https://[a-z]+\\.zoom\\.us/j/[^\n\r \"<>]+)") | .url) //
      (.description // "" | capture("(?<url>https://teams\\.microsoft\\.com/l/meetup-join/[^\n\r \"<>]+)") | .url) //
      (.description // "" | capture("(?<url>https://meet\\.google\\.com/[^\n\r \"<>]+)") | .url) //
      null
    ),
    organizer: {
      email: .organizer.email,
      name: (.organizer.displayName // .organizer.email),
      is_self: (.organizer.self // false)
    },
    attendees: [
      (.attendees // [])[] | {
        email: .email,
        name: (.displayName // .email),
        response: .responseStatus,
        is_self: (.self // false),
        is_resource: (.resource // false)
      }
    ],
    my_response: (
      [(.attendees // [])[] | select(.self == true) | .responseStatus][0] // "accepted"
    ),
    room: (
      [(.attendees // [])[] | select(.resource == true and .responseStatus == "accepted") | .displayName][0] // null
    ),
    attendee_count: ([(.attendees // [])[] | select(.resource != true)] | length),
    is_one_on_one: (
      [(.attendees // [])[] | select(.resource != true)] | length == 2
    ),
    other_person: (
      if ([(.attendees // [])[] | select(.resource != true)] | length) == 2
      then [(.attendees // [])[] | select(.resource != true and (.self // false) != true)][0] | {
        name: (.displayName // .email),
        email: .email
      }
      else null
      end
    )
  }
] | sort_by(.start)'
