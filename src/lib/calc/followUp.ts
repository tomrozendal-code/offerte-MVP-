// Follow-up planning (CLAUDE.md 11.1 and 11.2). Pure functions: the cron job and the quote page
// call these to decide what to do; they never send anything themselves.

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REMINDERS = 2;
const TIME_ZONE = "Europe/Amsterdam";

export type QuoteFollowUpStatus = "draft" | "sent" | "viewed" | "reminded" | "accepted" | "rejected" | "expired";

export type ReminderSettings = {
  enabled: boolean;
  /** Days after sending, e.g. [3, 7]. At most two are used. */
  days: number[];
  /** Hour of the day (Dutch time) at which reminders go out, e.g. 9 for 09:00. */
  hour: number;
};

export type ReminderQuoteState = {
  status: QuoteFollowUpStatus;
  outcome: "won" | "lost" | null;
  remindersDisabled: boolean;
  sentAt: Date | null;
  /** End of the validity period; no reminder after this moment. */
  expiresAt: Date;
  /** Reminder indexes (0 = first, 1 = second) that were already sent or claimed for sending. */
  sentReminders: number[];
  /** Reminder indexes the painter chose to skip. */
  skippedReminders: number[];
  clientEmail: string | null;
  clientPhone: string | null;
};

export type ReminderChannel = "email" | "whatsapp_prompt";

export type ReminderDecision =
  | { action: "send"; reminderIndex: number; dueAt: Date; channel: ReminderChannel }
  | { action: "wait"; reminderIndex: number; dueAt: Date }
  | { action: "none"; reason: ReminderStopReason };

export type ReminderStopReason =
  | "disabled" // switched off in settings or for this quote
  | "not_sent" // quote is still a draft
  | "responded" // accepted, rejected, or marked won/lost by the painter
  | "expired" // past the validity date
  | "all_done" // all reminders handled
  | "next_after_expiry" // the next reminder would fall after the validity date
  | "no_contact"; // no e-mail address and no phone number

/**
 * Decides whether a reminder should be sent now, and otherwise when the next one is due.
 * If the cron job was down and several reminders are overdue, only the latest is sent,
 * so the client never gets two reminders at once.
 */
export function planReminder(quote: ReminderQuoteState, settings: ReminderSettings, now: Date): ReminderDecision {
  if (!settings.enabled || quote.remindersDisabled) return { action: "none", reason: "disabled" };
  if (quote.sentAt === null || quote.status === "draft") return { action: "none", reason: "not_sent" };
  if (quote.outcome !== null || quote.status === "accepted" || quote.status === "rejected") {
    return { action: "none", reason: "responded" };
  }
  if (quote.status === "expired" || now > quote.expiresAt) return { action: "none", reason: "expired" };

  const days = [...settings.days].sort((a, b) => a - b).slice(0, MAX_REMINDERS);
  // Reminders before the last sent one are never sent anymore (they were passed over after downtime).
  const lastSent = Math.max(-1, ...quote.sentReminders);
  const open = days
    .map((d, index) => ({ index, dueAt: reminderDueAt(quote.sentAt!, d, settings.hour) }))
    .filter((r) => r.index > lastSent && !quote.skippedReminders.includes(r.index));

  if (open.length === 0) return { action: "none", reason: "all_done" };

  const due = open.filter((r) => r.dueAt <= now);
  const next = due.length > 0 ? due[due.length - 1] : open[0];
  if (next.dueAt > quote.expiresAt) return { action: "none", reason: "next_after_expiry" };
  if (due.length === 0) return { action: "wait", reminderIndex: next.index, dueAt: next.dueAt };

  const channel: ReminderChannel | null = quote.clientEmail ? "email" : quote.clientPhone ? "whatsapp_prompt" : null;
  if (channel === null) return { action: "none", reason: "no_contact" };
  return { action: "send", reminderIndex: next.index, dueAt: next.dueAt, channel };
}

/**
 * Day `days` after sending, at `hour`:00 Dutch time (summer and winter time handled).
 * Example: sent on Monday 16:30, days = 3, hour = 9 → Thursday 09:00.
 */
export function reminderDueAt(sentAt: Date, days: number, hour: number): Date {
  const { year, month, day } = zonedParts(sentAt);
  return zonedTimeToUtc(year, month, day + days, hour);
}

// Creating a formatter is slow; create it once.
const dutchTime = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function zonedParts(date: Date) {
  const parts = dutchTime.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** Offset of Dutch time from UTC at a moment, in milliseconds (1 or 2 hours). */
function offsetMs(date: Date): number {
  const p = zonedParts(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}

function zonedTimeToUtc(year: number, month: number, day: number, hour: number): Date {
  // Date.UTC handles day overflow (e.g. 33 November → 3 December).
  const asIfUtc = Date.UTC(year, month - 1, day, hour);
  const guess = asIfUtc - offsetMs(new Date(asIfUtc));
  return new Date(asIfUtc - offsetMs(new Date(guess)));
}

export type ViewDecision = {
  /** Count this visit (first/last viewed, number of views). */
  record: boolean;
  /** Send the painter a "bekijkt nu je offerte" notification. */
  notify: boolean;
};

/**
 * A visit to the share link. Visits by the painter are ignored. The painter is notified on the
 * first visit, and again only if the quote was not viewed for more than 24 hours.
 */
export function decideViewNotification(lastClientViewAt: Date | null, now: Date, viewerIsOwner: boolean): ViewDecision {
  if (viewerIsOwner) return { record: false, notify: false };
  if (lastClientViewAt === null) return { record: true, notify: true };
  return { record: true, notify: now.getTime() - lastClientViewAt.getTime() > DAY_MS };
}
