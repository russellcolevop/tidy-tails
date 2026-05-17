import { describe, it, expect } from "vitest";
import type { Appointment } from "./data/types";
import { lastAppointment, usualPrice, usualService } from "./derive";

// Minimal Appointment builder — only the fields these helpers read matter.
function appt(date: string, service: string, price: number): Appointment {
  return {
    id: `a-${date}-${service}-${price}`,
    client_id: "c",
    pet_id: "p",
    date,
    service,
    price,
    notes: null,
    created_at: date,
  };
}

describe("lastAppointment — last-visit derivation", () => {
  it("returns null when there are no appointments", () => {
    expect(lastAppointment([])).toBeNull();
  });

  it("returns the single appointment when there is only one", () => {
    const only = appt("2026-02-01", "Full groom", 80);
    expect(lastAppointment([only])).toBe(only);
  });

  it("picks the most recent appointment regardless of input order", () => {
    const newest = appt("2026-05-01", "Full groom", 80);
    const list = [
      appt("2026-01-10", "Bath & tidy", 50),
      newest,
      appt("2026-03-22", "Full groom", 80),
    ];
    expect(lastAppointment(list)).toBe(newest);
  });
});

describe("usualService — most common service", () => {
  it("returns null when there are no appointments", () => {
    expect(usualService([])).toBeNull();
  });

  it("returns the only service for a single appointment", () => {
    expect(usualService([appt("2026-02-01", "Nail trim", 25)])).toBe("Nail trim");
  });

  it("returns the most frequently booked service", () => {
    const list = [
      appt("2026-01-01", "Full groom", 80),
      appt("2026-02-01", "Full groom", 80),
      appt("2026-03-01", "Bath & tidy", 50),
    ];
    expect(usualService(list)).toBe("Full groom");
  });

  it("breaks a frequency tie with the most recent appointment's service", () => {
    const list = [
      appt("2026-01-01", "Bath & tidy", 50),
      appt("2026-01-02", "Full groom", 80),
      appt("2026-03-01", "Bath & tidy", 50),
      appt("2026-03-02", "Full groom", 80), // newest — both services tie 2–2
    ];
    expect(usualService(list)).toBe("Full groom");
  });
});

describe("usualPrice — typical price (median)", () => {
  it("returns null when there are no appointments", () => {
    expect(usualPrice([])).toBeNull();
  });

  it("returns the only price for a single appointment", () => {
    expect(usualPrice([appt("2026-02-01", "Full groom", 72)])).toBe(72);
  });

  it("returns the middle price for an odd number of appointments", () => {
    const list = [
      appt("2026-01-01", "Full groom", 70),
      appt("2026-02-01", "Full groom", 90),
      appt("2026-03-01", "Full groom", 80),
    ];
    expect(usualPrice(list)).toBe(80);
  });

  it("averages the two middle prices for an even number of appointments", () => {
    const list = [
      appt("2026-01-01", "Full groom", 70),
      appt("2026-02-01", "Full groom", 80),
    ];
    expect(usualPrice(list)).toBe(75);
  });

  it("is not skewed by a single outlier price", () => {
    const list = [
      appt("2026-01-01", "Full groom", 70),
      appt("2026-02-01", "Full groom", 72),
      appt("2026-03-01", "Full groom", 74),
      appt("2026-04-01", "Full groom", 76),
      appt("2026-05-01", "Full groom", 500),
    ];
    expect(usualPrice(list)).toBe(74);
  });
});
