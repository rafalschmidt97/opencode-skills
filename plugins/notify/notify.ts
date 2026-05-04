/**
 * notify
 * Native OS notifications for OpenCode with time-based routing
 *
 * Philosophy: "Notify the human when the AI needs them back, not for every micro-event."
 *
 * Features:
 * - Auto-detects terminal emulator (Ghostty, Kitty, iTerm, WezTerm, etc.)
 * - Suppresses notifications when terminal is focused (like Ghostty does)
 * - Click notification to focus terminal
 * - Parent session only by default (no spam from sub-tasks)
 * - Time-based routing: macOS native during work hours, push notifications after hours
 * - Weekend override: force a specific channel on weekends
 * - Feature flag: switch between "schedule" (time-based routing) and "local" (always macOS native)
 * - Hot-reloadable config: edit kdco-notify.json and changes take effect on next event
 *
 * Uses node-notifier which bundles native binaries:
 * - macOS: terminal-notifier (native NSUserNotificationCenter)
 * - Windows: SnoreToast (native toast notifications)
 * - Linux: notify-send (native desktop notifications)
 *
 * Push notifications use ntfy.sh (no extra dependencies, just HTTP POST via native fetch).
 *
 * ==========================================
 * SETUP INSTRUCTIONS
 * ==========================================
 *
 * 1. Edit ~/.config/opencode/kdco-notify.json
 *    - Set "mode" to "schedule" (time-based routing) or "local" (always macOS native)
 *    - Configure schedule slots with "local", "push", or "silent" channels
 *
 * 2. Create ~/.config/opencode/kdco-notify.local.json for secrets:
 *    - Set your ntfy topic: { "push": { "topic": "your-secret-topic" } }
 *    - This file is NOT tracked in git (keep it out of version control)
 *    - The local file is deep-merged over the base config
 *
 * 3. Install the ntfy app on your iPhone (free, App Store)
 *    - Open the app, tap +, subscribe to your topic
 *
 * 3. Done! Push notifications arrive during your configured push hours.
 *    - To switch modes: edit "mode" in kdco-notify.json (hot-reloaded, no restart needed)
 *    - Weekends default to "local" (macOS native) regardless of schedule
 *    - Tap a push notification to deep-link into Blink Shell (uses clickUrl)
 *
 * 4. (Optional) Enable x-callback-url in Blink Shell for deep linking:
 *    - In Blink, run `config` > scroll to x-callback-url > enable it > set an API key
 *    - Set clickUrl to "blinkshell://run?key=YOUR_KEY&cmd=ssh%20w" in kdco-notify.json
 *    - Without the key param, tapping still opens Blink but won't auto-run the command
 *
 * Example kdco-notify.json:
 * {
 *   "mode": "schedule",
 *   "weekendChannel": "local",
 *   "schedule": [
 *     { "start": "07:00", "end": "17:00", "channel": "local" },
 *     { "start": "17:00", "end": "22:00", "channel": "push" },
 *     { "start": "22:00", "end": "07:00", "channel": "silent" }
 *   ],
 *   "push": {
 *     "service": "ntfy",
 *     "sshHint": "open blink and write \"ssh w\""
 *   }
 * }
 *
 * Example kdco-notify.local.json (secrets, not tracked):
 * {
 *   "push": { "topic": "your-secret-topic" }
 * }
 */

import * as fs from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"
import type { Plugin } from "@opencode-ai/plugin"
import type { Event } from "@opencode-ai/sdk"
// @ts-expect-error - installed at runtime by OCX
import detectTerminal from "detect-terminal"
// @ts-expect-error - installed at runtime by OCX
import notifier from "node-notifier"
import type { OpencodeClient } from "./kdco-primitives/types"

type NotificationChannel = "local" | "push" | "silent"

interface ScheduleSlot {
	start: string // "HH:MM" format
	end: string // "HH:MM" format
	channel: NotificationChannel
}

interface PushConfig {
	service: "ntfy"
	topic: string
	/** ntfy server URL (default: "https://ntfy.sh") */
	server?: string
	/** ntfy priority 1-5 (default: 3) */
	priority?: number
	/** Hint appended to push message body (e.g. 'open blink and write "ssh w"') */
	sshHint?: string
	/** URL opened when tapping the notification (e.g. "ssh://user@host" to deep-link into Blink Shell) */
	clickUrl?: string
}

interface NotifyConfig {
	/** Feature flag: "schedule" for time-based routing, "local" for always macOS native (default: "schedule") */
	mode: "local" | "schedule"
	/** Channel to use on weekends, overriding the schedule (default: "local") */
	weekendChannel: NotificationChannel
	/** Time-based routing slots (weekdays only, evaluated in order) */
	schedule: ScheduleSlot[]
	/** Push notification delivery config (required if any schedule slot uses "push") */
	push?: PushConfig
	/** Also send push notification when Mac screen is locked during "local" hours (default: true) */
	pushWhenLocked: boolean
	/** Notify for child/sub-session events (default: false) */
	notifyChildSessions: boolean
	/** Sound configuration per event type (local notifications only) */
	sounds: {
		idle: string
		error: string
		permission: string
		question?: string
	}
	/** Legacy quiet hours configuration (fallback if no schedule defined) */
	quietHours: {
		enabled: boolean
		start: string // "HH:MM" format
		end: string // "HH:MM" format
	}
	/** Override terminal detection (optional) */
	terminal?: string
}

interface TerminalInfo {
	name: string | null
	bundleId: string | null
	processName: string | null
}

const DEFAULT_CONFIG: NotifyConfig = {
	mode: "schedule",
	weekendChannel: "local",
	schedule: [],
	pushWhenLocked: true,
	notifyChildSessions: false,
	sounds: {
		idle: "Glass",
		error: "Basso",
		permission: "Submarine",
	},
	quietHours: {
		enabled: false,
		start: "22:00",
		end: "08:00",
	},
}

// Terminal name to macOS process name mapping (for focus detection)
const TERMINAL_PROCESS_NAMES: Record<string, string> = {
	ghostty: "Ghostty",
	kitty: "kitty",
	iterm: "iTerm2",
	iterm2: "iTerm2",
	wezterm: "WezTerm",
	alacritty: "Alacritty",
	terminal: "Terminal",
	apple_terminal: "Terminal",
	hyper: "Hyper",
	warp: "Warp",
	vscode: "Code",
	"vscode-insiders": "Code - Insiders",
}

// ==========================================
// CONFIGURATION
// ==========================================

async function loadConfig(): Promise<NotifyConfig> {
	const configDir = path.join(os.homedir(), ".config", "opencode")
	const configPath = path.join(configDir, "kdco-notify.json")
	const localPath = path.join(configDir, "kdco-notify.local.json")

	let userConfig: Partial<NotifyConfig> = {}
	let localConfig: Partial<NotifyConfig> = {}

	try {
		const content = await fs.readFile(configPath, "utf8")
		userConfig = JSON.parse(content) as Partial<NotifyConfig>
	} catch {
		// Base config doesn't exist or is invalid
	}

	try {
		const content = await fs.readFile(localPath, "utf8")
		localConfig = JSON.parse(content) as Partial<NotifyConfig>
	} catch {
		// Local overrides don't exist or are invalid
	}

	// Deep merge: defaults <- base config <- local overrides
	const merged = { ...userConfig, ...localConfig }

	return {
		...DEFAULT_CONFIG,
		...merged,
		sounds: {
			...DEFAULT_CONFIG.sounds,
			...userConfig.sounds,
			...localConfig.sounds,
		},
		quietHours: {
			...DEFAULT_CONFIG.quietHours,
			...userConfig.quietHours,
			...localConfig.quietHours,
		},
		schedule: merged.schedule ?? DEFAULT_CONFIG.schedule,
		push: {
			...userConfig.push,
			...localConfig.push,
		} as NotifyConfig["push"],
	}
}

// ==========================================
// TERMINAL DETECTION (macOS)
// ==========================================

async function runOsascript(script: string): Promise<string | null> {
	if (process.platform !== "darwin") return null

	try {
		const proc = Bun.spawn(["osascript", "-e", script], {
			stdout: "pipe",
			stderr: "pipe",
		})
		const output = await new Response(proc.stdout).text()
		return output.trim()
	} catch {
		return null
	}
}

async function getBundleId(appName: string): Promise<string | null> {
	return runOsascript(`id of application "${appName}"`)
}

async function getFrontmostApp(): Promise<string | null> {
	return runOsascript(
		'tell application "System Events" to get name of first application process whose frontmost is true',
	)
}

async function detectTerminalInfo(config: NotifyConfig): Promise<TerminalInfo> {
	// Use config override if provided
	const terminalName = config.terminal || detectTerminal() || null

	if (!terminalName) {
		return { name: null, bundleId: null, processName: null }
	}

	// Get process name for focus detection
	const processName = TERMINAL_PROCESS_NAMES[terminalName.toLowerCase()] || terminalName

	// Dynamically get bundle ID from macOS (no hardcoding!)
	const bundleId = await getBundleId(processName)

	return {
		name: terminalName,
		bundleId,
		processName,
	}
}

async function isTerminalFocused(terminalInfo: TerminalInfo): Promise<boolean> {
	if (!terminalInfo.processName) return false
	if (process.platform !== "darwin") return false

	const frontmost = await getFrontmostApp()
	if (!frontmost) return false

	// Case-insensitive comparison
	return frontmost.toLowerCase() === terminalInfo.processName.toLowerCase()
}

async function isScreenLocked(): Promise<boolean> {
	if (process.platform !== "darwin") return false

	try {
		const proc = Bun.spawn(
			["ioreg", "-n", "Root", "-d1", "-a"],
			{ stdout: "pipe", stderr: "pipe" },
		)
		const output = await new Response(proc.stdout).text()
		return output.includes("CGSSessionScreenIsLocked</key>") && output.includes("<true/>")
	} catch {
		return false
	}
}

// ==========================================
// QUIET HOURS CHECK (legacy fallback)
// ==========================================

function isQuietHours(config: NotifyConfig): boolean {
	if (!config.quietHours.enabled) return false

	const now = new Date()
	const currentMinutes = now.getHours() * 60 + now.getMinutes()

	const [startHour, startMin] = config.quietHours.start.split(":").map(Number)
	const [endHour, endMin] = config.quietHours.end.split(":").map(Number)

	const startMinutes = startHour * 60 + startMin
	const endMinutes = endHour * 60 + endMin

	// Handle overnight quiet hours (e.g., 22:00 - 08:00)
	if (startMinutes > endMinutes) {
		return currentMinutes >= startMinutes || currentMinutes < endMinutes
	}

	return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

// ==========================================
// CHANNEL ROUTING (schedule / mode / weekend)
// ==========================================

function timeInSlot(currentMinutes: number, startMin: number, endMin: number): boolean {
	// Handle overnight slots (e.g., 22:00 - 07:00)
	if (startMin > endMin) {
		return currentMinutes >= startMin || currentMinutes < endMin
	}
	return currentMinutes >= startMin && currentMinutes < endMin
}

function getActiveChannel(config: NotifyConfig): NotificationChannel {
	// Feature flag: bypass schedule entirely
	if (config.mode === "local") return "local"

	// Weekend override (Saturday = 6, Sunday = 0)
	const day = new Date().getDay()
	if (day === 0 || day === 6) return config.weekendChannel ?? "local"

	// Check schedule slots (evaluated in order, first match wins)
	if (config.schedule?.length) {
		const now = new Date()
		const currentMinutes = now.getHours() * 60 + now.getMinutes()

		for (const slot of config.schedule) {
			const [sh, sm] = slot.start.split(":").map(Number)
			const [eh, em] = slot.end.split(":").map(Number)
			const startMin = sh * 60 + sm
			const endMin = eh * 60 + em

			if (timeInSlot(currentMinutes, startMin, endMin)) {
				return slot.channel
			}
		}
	}

	// Fallback: legacy quietHours check
	if (isQuietHours(config)) return "silent"

	// Ultimate fallback: local notifications
	return "local"
}

// ==========================================
// PUSH NOTIFICATION (ntfy.sh)
// ==========================================

async function sendPushNotification(
	push: PushConfig,
	title: string,
	message: string,
): Promise<void> {
	const server = push.server ?? "https://ntfy.sh"
	const body = push.sshHint ? `${message}\n\n${push.sshHint}` : message

	const headers: Record<string, string> = {
		Title: title,
		Priority: String(push.priority ?? 3),
		Tags: "computer",
	}

	// Deep link: tap notification to open URL (e.g. ssh://user@host opens Blink Shell)
	if (push.clickUrl) {
		headers.Click = push.clickUrl
	}

	try {
		await fetch(`${server}/${push.topic}`, {
			method: "POST",
			headers,
			body,
		})
	} catch {
		// Push delivery failed silently -- don't crash the plugin
	}
}

// ==========================================
// PARENT SESSION DETECTION
// ==========================================

async function isParentSession(client: OpencodeClient, sessionID: string): Promise<boolean> {
	try {
		const session = await client.session.get({ path: { id: sessionID } })
		// No parentID means this IS the parent/root session
		return !session.data?.parentID
	} catch {
		// If we can't fetch, assume it's a parent to be safe (notify rather than miss)
		return true
	}
}

// ==========================================
// NOTIFICATION SENDER
// ==========================================

interface NotificationOptions {
	title: string
	message: string
	sound: string
	terminalInfo: TerminalInfo
}

function sendLocalNotification(options: NotificationOptions): void {
	const { title, message, sound, terminalInfo } = options

	// Base notification options
	const notifyOptions: Record<string, unknown> = {
		title,
		message,
		sound,
	}

	// macOS-specific: click notification to focus terminal
	if (process.platform === "darwin" && terminalInfo.bundleId) {
		notifyOptions.activate = terminalInfo.bundleId
	}

	notifier.notify(notifyOptions)
}

async function routeNotification(
	options: NotificationOptions,
	config: NotifyConfig,
): Promise<void> {
	const channel = getActiveChannel(config)

	switch (channel) {
		case "local":
			sendLocalNotification(options)
			// Also send push if Mac is locked (user walked away during work hours)
			if (config.pushWhenLocked && config.push && (await isScreenLocked())) {
				await sendPushNotification(config.push, options.title, options.message)
			}
			break
		case "push":
			if (config.push) {
				await sendPushNotification(config.push, options.title, options.message)
			} else {
				// No push config -- graceful fallback to local
				sendLocalNotification(options)
			}
			break
		case "silent":
			// Do nothing
			break
	}
}

// ==========================================
// EVENT HANDLERS
// ==========================================

async function handleSessionIdle(
	client: OpencodeClient,
	sessionID: string,
	config: NotifyConfig,
	terminalInfo: TerminalInfo,
): Promise<void> {
	// Check if we should notify for this session
	if (!config.notifyChildSessions) {
		const isParent = await isParentSession(client, sessionID)
		if (!isParent) return
	}

	// Check channel routing
	const channel = getActiveChannel(config)
	if (channel === "silent") return

	// Only check focus for local (user is away from Mac during push hours)
	if (channel === "local" && (await isTerminalFocused(terminalInfo))) return

	// Get session info for context
	let sessionTitle = "Task"
	try {
		const session = await client.session.get({ path: { id: sessionID } })
		if (session.data?.title) {
			sessionTitle = session.data.title.slice(0, 50)
		}
	} catch {
		// Use default title
	}

	await routeNotification(
		{
			title: "Ready for review",
			message: sessionTitle,
			sound: config.sounds.idle,
			terminalInfo,
		},
		config,
	)
}

async function handleSessionError(
	client: OpencodeClient,
	sessionID: string,
	error: string | undefined,
	config: NotifyConfig,
	terminalInfo: TerminalInfo,
): Promise<void> {
	// Check if we should notify for this session
	if (!config.notifyChildSessions) {
		const isParent = await isParentSession(client, sessionID)
		if (!isParent) return
	}

	// Check channel routing
	const channel = getActiveChannel(config)
	if (channel === "silent") return

	// Only check focus for local
	if (channel === "local" && (await isTerminalFocused(terminalInfo))) return

	const errorMessage = error?.slice(0, 100) || "Something went wrong"

	await routeNotification(
		{
			title: "Something went wrong",
			message: errorMessage,
			sound: config.sounds.error,
			terminalInfo,
		},
		config,
	)
}

async function handlePermissionUpdated(
	config: NotifyConfig,
	terminalInfo: TerminalInfo,
): Promise<void> {
	// Always notify for permission events - AI is blocked waiting for human
	// No parent check needed: permissions always need human attention

	// Check channel routing
	const channel = getActiveChannel(config)
	if (channel === "silent") return

	// Only check focus for local
	if (channel === "local" && (await isTerminalFocused(terminalInfo))) return

	await routeNotification(
		{
			title: "Waiting for you",
			message: "OpenCode needs your input",
			sound: config.sounds.permission,
			terminalInfo,
		},
		config,
	)
}

async function handleQuestionAsked(
	config: NotifyConfig,
	terminalInfo: TerminalInfo,
): Promise<void> {
	// Check channel routing
	const channel = getActiveChannel(config)
	if (channel === "silent") return

	const sound = config.sounds.question ?? config.sounds.permission

	await routeNotification(
		{
			title: "Question for you",
			message: "OpenCode needs your input",
			sound,
			terminalInfo,
		},
		config,
	)
}

// ==========================================
// PLUGIN EXPORT
// ==========================================

export const NotifyPlugin: Plugin = async (ctx) => {
	const { client } = ctx

	// Detect terminal once at startup (cached -- terminal doesn't change mid-session)
	const terminalInfo = await detectTerminalInfo(await loadConfig())

	return {
		"tool.execute.before": async (input: { tool: string; sessionID: string; callID: string }) => {
			if (input.tool === "question") {
				// Hot-reload config on each event
				const config = await loadConfig()
				await handleQuestionAsked(config, terminalInfo)
			}
		},
		event: async ({ event }: { event: Event }): Promise<void> => {
			// Hot-reload config on each event (tiny JSON read, negligible cost)
			const config = await loadConfig()

			switch (event.type) {
				case "session.idle": {
					const sessionID = event.properties.sessionID
					if (sessionID) {
						await handleSessionIdle(client as OpencodeClient, sessionID, config, terminalInfo)
					}
					break
				}
				case "session.error": {
					const sessionID = event.properties.sessionID
					const error = event.properties.error
					const errorMessage = typeof error === "string" ? error : error ? String(error) : undefined
					if (sessionID) {
						await handleSessionError(
							client as OpencodeClient,
							sessionID,
							errorMessage,
							config,
							terminalInfo,
						)
					}
					break
				}

				case "permission.updated": {
					await handlePermissionUpdated(config, terminalInfo)
					break
				}
			}
		},
	}
}

export default NotifyPlugin
