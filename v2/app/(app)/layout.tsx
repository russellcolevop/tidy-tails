import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { DataModeBanner } from "@/components/DataModeBanner";

// Authenticated shell. Constrained to a phone-width column — Tidy Tails v2 is
// mobile-first by design; desktop works but is not the design target.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-canvas">
      <DataModeBanner />
      <AppHeader />
      <div className="flex-1 pad-bottom-nav">{children}</div>
      <BottomNav />
    </div>
  );
}
