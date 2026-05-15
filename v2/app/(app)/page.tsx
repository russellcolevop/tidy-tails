import { ClientSearch, type ClientSummary } from "@/components/ClientSearch";
import { loadDataset } from "@/lib/data/repo";
import { lastAppointment } from "@/lib/derive";
import { fullName } from "@/lib/format";

// Render per request: the client list shows time-relative labels ("12 days
// ago") that must be computed against the current date, not frozen at build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { clients, pets, appointments } = await loadDataset();

  const summaries: ClientSummary[] = [...clients]
    .sort(
      (a, b) =>
        a.last_name.localeCompare(b.last_name) ||
        a.first_name.localeCompare(b.first_name),
    )
    .map((c) => {
      const ownPets = pets.filter((p) => p.client_id === c.id);
      const last = lastAppointment(appointments.filter((a) => a.client_id === c.id));
      return {
        id: c.id,
        name: fullName(c.first_name, c.last_name),
        phone: c.phone,
        petNames: ownPets.map((p) => p.name),
        hasAllergy: ownPets.some((p) => p.allergies),
        lastVisit: last?.date ?? null,
      };
    });

  return (
    <main className="px-4 py-5">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-ink">Tidy Tails</h1>
        <p className="text-sm text-ink-soft">
          Find a client before they walk in.
        </p>
      </header>
      <ClientSearch summaries={summaries} />
    </main>
  );
}
