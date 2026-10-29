import { describe, expect, it } from "vitest";
import { decideViewNotification, planReminder, type ReminderQuoteState, type ReminderSettings } from "./followUp";

const DAY = 24 * 60 * 60 * 1000;
const sentAt = new Date("2026-11-02T09:00:00Z"); // day 0
const day = (n: number, time = "09:00") => new Date(sentAt.getTime() + n * DAY + (timeToMs(time) - timeToMs("09:00")));
function timeToMs(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h * 60 + m) * 60 * 1000;
}

const settings: ReminderSettings = { enabled: true, days: [3, 7] };

const quote = (overrides: Partial<ReminderQuoteState> = {}): ReminderQuoteState => ({
  status: "sent",
  outcome: null,
  remindersDisabled: false,
  sentAt,
  expiresAt: day(30),
  sentReminders: [],
  skippedReminders: [],
  clientEmail: "klant@example.test",
  clientPhone: null,
  ...overrides,
});

/** Simulates the cron job every 15 minutes and returns the days on which reminders were sent. */
function simulate(q: ReminderQuoteState, s: ReminderSettings, untilDay: number, onDay?: (d: number, q: ReminderQuoteState) => void) {
  const sentOn: number[] = [];
  for (let t = sentAt.getTime(); t <= day(untilDay).getTime(); t += 15 * 60 * 1000) {
    const now = new Date(t);
    onDay?.((t - sentAt.getTime()) / DAY, q);
    const d = planReminder(q, s, now);
    if (d.action === "send") {
      sentOn.push((t - sentAt.getTime()) / DAY);
      q.sentReminders = [...q.sentReminders, d.reminderIndex];
      q.status = "reminded";
    }
  }
  return sentOn;
}

describe("test case 6: reminders on day 3 and day 7", () => {
  it("sends on day 3 and day 7, then nothing", () => {
    expect(simulate(quote(), settings, 30)).toEqual([3, 7]);
  });

  it("drops the day-7 reminder after acceptance on day 4", () => {
    const sent = simulate(quote(), settings, 30, (d, q) => {
      if (d >= 4) q.status = "accepted";
    });
    expect(sent).toEqual([3]);
  });

  it("stops when the client rejects or the painter marks won/lost", () => {
    expect(planReminder(quote({ status: "rejected" }), settings, day(3)).action).toBe("none");
    expect(planReminder(quote({ outcome: "won" }), settings, day(3)).action).toBe("none");
    expect(planReminder(quote({ outcome: "lost" }), settings, day(7))).toEqual({ action: "none", reason: "responded" });
  });

  it("shows when the next reminder is planned", () => {
    expect(planReminder(quote(), settings, day(1))).toEqual({ action: "wait", reminderIndex: 0, dueAt: day(3) });
    expect(planReminder(quote({ sentReminders: [0] }), settings, day(4))).toEqual({ action: "wait", reminderIndex: 1, dueAt: day(7) });
  });

  it("never sends the same reminder twice", () => {
    expect(planReminder(quote({ sentReminders: [0] }), settings, day(3, "09:15")).action).toBe("wait");
    expect(planReminder(quote({ sentReminders: [0, 1] }), settings, day(8))).toEqual({ action: "none", reason: "all_done" });
  });

  it("sends only the latest overdue reminder after downtime, and not the older one afterwards", () => {
    expect(planReminder(quote(), settings, day(8))).toMatchObject({ action: "send", reminderIndex: 1 });
    expect(planReminder(quote({ sentReminders: [1] }), settings, day(8, "09:15"))).toEqual({ action: "none", reason: "all_done" });
  });

  it("uses at most two reminders", () => {
    expect(simulate(quote(), { enabled: true, days: [1, 2, 3] }, 30)).toEqual([1, 2]);
  });
});

describe("test case 7: valid for 5 days", () => {
  it("sends on day 3 but not on day 7", () => {
    expect(simulate(quote({ expiresAt: day(5) }), settings, 30)).toEqual([3]);
    expect(planReminder(quote({ expiresAt: day(5), sentReminders: [0] }), settings, day(4))).toEqual({
      action: "none",
      reason: "next_after_expiry",
    });
  });

  it("never sends after the expiry date", () => {
    expect(planReminder(quote({ expiresAt: day(2) }), settings, day(3))).toEqual({ action: "none", reason: "expired" });
    expect(planReminder(quote({ status: "expired" }), settings, day(3))).toEqual({ action: "none", reason: "expired" });
  });
});

describe("test case 8: reminders switched off", () => {
  it("sends nothing when switched off for this quote", () => {
    expect(simulate(quote({ remindersDisabled: true }), settings, 30)).toEqual([]);
  });

  it("sends nothing when switched off in settings", () => {
    expect(simulate(quote(), { ...settings, enabled: false }, 30)).toEqual([]);
  });

  it("skips only the reminder the painter skipped", () => {
    expect(simulate(quote({ skippedReminders: [0] }), settings, 30)).toEqual([7]);
    expect(simulate(quote({ skippedReminders: [1] }), settings, 30)).toEqual([3]);
    expect(simulate(quote({ skippedReminders: [0, 1] }), settings, 30)).toEqual([]);
  });
});

describe("channels", () => {
  it("sends e-mail when the client has an e-mail address", () => {
    expect(planReminder(quote(), settings, day(3))).toMatchObject({ channel: "email" });
  });

  it("prepares a WhatsApp message for the painter when there is only a phone number", () => {
    expect(planReminder(quote({ clientEmail: null, clientPhone: "0612345678" }), settings, day(3))).toMatchObject({ channel: "whatsapp_prompt" });
  });

  it("does nothing without contact details", () => {
    expect(planReminder(quote({ clientEmail: null }), settings, day(3))).toEqual({ action: "none", reason: "no_contact" });
  });

  it("does nothing for drafts", () => {
    expect(planReminder(quote({ status: "draft", sentAt: null }), settings, day(3))).toEqual({ action: "none", reason: "not_sent" });
  });
});

describe("test case 9: view notifications", () => {
  it("notifies on day 1 at 10:00 and on day 3, not at 10:05", () => {
    let last: Date | null = null;
    const visits = [day(1, "10:00"), day(1, "10:05"), day(3, "10:00")];
    const notified = visits.map((at) => {
      const d = decideViewNotification(last, at, false);
      if (d.record) last = at;
      return d.notify;
    });
    expect(notified).toEqual([true, false, true]);
  });

  it("ignores the painter opening their own link", () => {
    expect(decideViewNotification(null, day(1), true)).toEqual({ record: false, notify: false });
  });

  it("does not notify again within 24 hours", () => {
    expect(decideViewNotification(day(1, "10:00"), day(2, "10:00"), false).notify).toBe(false);
    expect(decideViewNotification(day(1, "10:00"), day(2, "10:01"), false).notify).toBe(true);
  });
});
