"use client";

import { useState } from "react";
import type { Client, Pet } from "@/lib/data/types";
import { formatPhone } from "@/lib/format";
import { GatedActionNotice } from "./GatedActionNotice";
import { Sheet } from "./Sheet";

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
  const [open, setOpen] = useState<"log" | "sms" | null>(null);
  const [petId, setPetId] = useState(pets[0]?.id ?? "");

  const selectedPet = pets.find((p) => p.id === petId) ?? pets[0] ?? null;
  const [price, setPrice] = useState(
    selectedPet?.typical_fee != null ? String(selectedPet.typical_fee) : "",
  );

  function onPetChange(nextId: string) {
    setPetId(nextId);
    const next = pets.find((p) => p.id === nextId);
    setPrice(next?.typical_fee != null ? String(next.typical_fee) : "");
  }

  const today = new Date().toISOString().slice(0, 10);
  const reminderText = `Hi ${client.first_name}, just a reminder that ${
    pets[0]?.name ?? "your dog"
  } has a grooming appointment coming up. See you soon! — Samantha`;

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setOpen("sms")}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-3 text-sm font-semibold text-white active:bg-brand-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Send reminder
        </button>
        <button
          type="button"
          onClick={() => setOpen("log")}
          className="flex items-center justify-center gap-2 rounded-xl border border-brand bg-brand-soft px-3 py-3 text-sm font-semibold text-brand-ink active:bg-brand-soft/70"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Log groom
        </button>
      </div>

      {/* Quick-log groom — UI complete, saving gated until Ship 2.4 */}
      <Sheet open={open === "log"} onClose={() => setOpen(null)} title="Log a groom">
        <div className="flex flex-col gap-3.5">
          <p className="text-sm text-ink-soft">
            For <span className="font-semibold text-ink">{client.first_name} {client.last_name}</span>
          </p>

          {pets.length > 1 ? (
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Pet</span>
              <select
                value={petId}
                onChange={(e) => onPetChange(e.target.value)}
                className={fieldClass}
              >
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          ) : selectedPet ? (
            <p className="text-sm text-ink-soft">
              Pet: <span className="font-semibold text-ink">{selectedPet.name}</span>
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Date</span>
            <input type="date" defaultValue={today} className={fieldClass} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Service</span>
            <input
              type="text"
              placeholder="e.g. Full groom — bath, haircut, nails"
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Price</span>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Notes (optional)</span>
            <input type="text" placeholder="Anything to remember" className={fieldClass} />
          </label>

          <button
            type="button"
            disabled
            className="rounded-xl bg-ink/15 px-4 py-3 text-base font-semibold text-ink-faint"
          >
            Save groom
          </button>
          <GatedActionNotice action="Saving a groom" />
        </div>
      </Sheet>

      {/* SMS reminder — UI complete, sending gated until Ship 2.5 */}
      <Sheet open={open === "sms"} onClose={() => setOpen(null)} title="Send a reminder">
        <div className="flex flex-col gap-3.5">
          <div className="rounded-xl bg-canvas px-3.5 py-2.5 text-sm">
            <span className="text-ink-soft">Texting </span>
            <span className="font-semibold text-ink">{formatPhone(client.phone)}</span>
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
