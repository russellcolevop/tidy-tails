"use client";

import { useState } from "react";
import type { Client, Pet } from "@/lib/data/types";
import { formatPhone } from "@/lib/format";
import { GatedActionNotice } from "./GatedActionNotice";
import { Sheet } from "./Sheet";

// Send reminder — UI complete, sending still gated. The reminder prep/send-
// confirm flow is its own upcoming slice; until then this surface previews the
// message but does not send. Groom logging moved to its own LogGroom component.

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint";
const labelClass = "text-sm font-medium text-ink-soft";

export function ClientActions({
  client,
  pets,
}: {
  client: Client;
  pets: Pet[];
}) {
  const [open, setOpen] = useState(false);

  const reminderText = `Hi ${client.first_name}, just a reminder that ${
    pets[0]?.name ?? "your dog"
  } has a grooming appointment coming up. See you soon! — Samantha`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand bg-brand-soft px-3 py-3 text-base font-semibold text-brand-ink active:bg-brand-soft/70"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Send reminder
      </button>

      {/* SMS reminder — UI complete, sending gated until the reminder slice */}
      <Sheet open={open} onClose={() => setOpen(false)} title="Send a reminder">
        <div className="flex flex-col gap-3.5">
          <div className="rounded-xl bg-canvas px-3.5 py-2.5 text-sm">
            <span className="text-ink-soft">Texting </span>
            <span className="font-semibold text-ink">
              {formatPhone(client.phone)}
            </span>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Message</span>
            <textarea
              rows={4}
              defaultValue={reminderText}
              className={`${fieldClass} resize-none leading-relaxed`}
            />
          </label>

          <button
            type="button"
            disabled
            className="rounded-xl bg-ink/15 px-4 py-3 text-base font-semibold text-ink-faint"
          >
            Send reminder
          </button>
          <GatedActionNotice action="Sending an SMS" />
        </div>
      </Sheet>
    </>
  );
}
