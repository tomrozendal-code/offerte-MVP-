// Follow-up planning (CLAUDE.md 11.1 and 11.2). Pure functions: the cron job and the quote page
// call these to decide what to do; they never send anything themselves.

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REMINDERS = 2;

export type QuoteFollowUpStatus = "draft" | "sent" | "viewed" | "reminded" | "accepted" | "rejected" | "expired";

export type ReminderSettings = {
  enabled: boolean;
  /** Days after sending, e.g. [3, 7]. At most two are used. */
  days: number[];
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
    .map((d, index) => ({ index, dueAt: new Date(quote.sentAt!.getTime() + d * DAY_MS) }))
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
