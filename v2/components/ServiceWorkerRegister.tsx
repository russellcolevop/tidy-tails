"use client";

import { useEffect } from "react";

// Registers the PWA service worker. Production only — a service worker in dev
// interferes with hot reload. Verify installability with `npm run build && npm start`.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure is non-fatal — the app still works online.
    });
  }, []);

  return null;
}
