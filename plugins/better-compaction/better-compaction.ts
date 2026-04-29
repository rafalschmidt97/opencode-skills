/**
 * better-compaction
 *
 * Replaces the default OpenCode compaction prompt with one that explicitly
 * preserves critical context details: exact technical values, user-pasted
 * content, behavioral constraints, and debugging state.
 *
 * Also writes the compaction summary to .opencode/handoffs/<date>-<topic>.md
 * for cross-session persistence.
 *
 * Motivated by: https://github.com/anomalyco/opencode/issues/16512
 *
 * Toggle off:
 *   OPENCODE_COMPACTION_DEFAULT=1 opencode
 *   (or use the `oo-default-compaction` shell alias)
 *
 * Delete this file to permanently revert to the built-in prompt.
 */

import type { Plugin } from "@opencode-ai/plugin"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const COMPACTION_PROMPT = `You are compacting a conversation so it can continue seamlessly in a fresh context window. Another agent will read ONLY your output and must be able to resume as if nothing happened.

RULES -- follow these strictly:
1. NEVER generalise or summarise away specifics. Keep exact file paths, flag names, config keys, error messages, URLs, version numbers, and numeric values.
2. If the user pasted external content (logs, errors, config snippets, code), reproduce the KEY PARTS verbatim -- do not paraphrase them.
3. Preserve ALL user-stated constraints and preferences ("don't do X", "always use Y", communication style notes).
4. Preserve debugging / investigation state: which hypotheses were tested, what was ruled out, and what evidence supported each conclusion.
5. When in doubt, keep the detail -- a slightly longer summary is far better than a lossy one.

Use this template:

---
## Goal

[Specific goal(s) the user is trying to accomplish]

## User Instructions & Constraints

- [Behavioural constraints, communication preferences, explicit "do / don't" rules]
- [If there is a plan, spec, or reference doc, include enough detail for the next agent to follow it]

## Key User-Provided Content

[Verbatim key parts of anything the user pasted: error output, config snippets, conversation logs, data samples. Use fenced code blocks.]

## Discoveries & Technical Details

[Exact findings: config values, paths, flag names, versions, API responses, measurements. What was tried and what happened -- with specifics, not generalisations.]

## Progress

### Completed
- [Specific completed work with file paths and what changed]

### Not Yet Solved
- [Open items with current investigation state and what has been ruled out]

### Next Steps
- [Planned actions the next agent should pick up]

## Relevant Files & Directories

[Structured list of files read, edited, or created. Include key external references (URLs, docs). If an entire directory is relevant, list the directory.]
---`

/**
 * Extract a filesystem-safe topic slug from the compaction summary's Goal section.
 */
function extractTopic(content: string): string {
	const goalMatch = content.match(/## Goal\s*\n+\s*(.+)/)
	const raw = goalMatch?.[1] || "session"
	return raw
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50)
}

/**
 * Extract text content from a message's parts array.
 */
function extractTextFromParts(parts: any[]): string {
	return (parts || [])
		.filter((p: any) => p.type === "text")
		.map((p: any) => p.text || "")
		.join("\n")
}

export const BetterCompactionPlugin: Plugin = async ({ client, directory }) => {
	return {
		"experimental.session.compacting": async (
			_input: { sessionID: string },
			output: { context: string[]; prompt: string | undefined },
		) => {
			// Bail out if the user wants the stock prompt (for A/B testing)
			if (process.env.OPENCODE_COMPACTION_DEFAULT === "1") return

			output.prompt = COMPACTION_PROMPT
		},

		event: async ({ event }: { event: { type: string; properties?: Record<string, any> } }) => {
			if (event.type !== "session.compacted") return
			if (process.env.OPENCODE_COMPACTION_DEFAULT === "1") return

			try {
				const sessionID = event.properties?.id
				if (!sessionID) return

				// Fetch session messages to find the compacted summary
				const result = await client.session.messages({
					path: { id: sessionID },
				})

				const messages: any[] = (result as any).data || []

				// Find the compacted message by searching for our template markers
				// Walk messages in reverse (most recent first)
				let compactedContent = ""
				for (const msg of [...messages].reverse()) {
					if (msg.role && msg.role !== "assistant") continue
					const text = extractTextFromParts(msg.parts)
					if (text.includes("## Goal") && text.includes("## Progress")) {
						compactedContent = text
						break
					}
				}

				if (!compactedContent) return

				// Write handoff file
				const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
				const topic = extractTopic(compactedContent)
				const handoffsDir = join(directory, ".opencode", "handoffs")
				await mkdir(handoffsDir, { recursive: true })

				const filename = `${date}-${topic}.md`
				await writeFile(join(handoffsDir, filename), compactedContent, "utf-8")
			} catch {
				// Silently fail — handoff writing should never block the session
			}
		},
	}
}

export default BetterCompactionPlugin
