import { create } from "zustand";

export const useAnalyticsStore = create((set) => ({
  data: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });

    try {
      const res = await fetch("/api/analytics/dump");

      // If backend isn't there or returns HTML, bail gracefully
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("Analytics API unavailable");
      }

      const json = await res.json();
      set({ data: json, loading: false });
    } catch (err) {
      // Optional: remove this console.error if you don't want noise
      console.error("Analytics load failed:", err);
      set({ error: err.message, loading: false, data: null });
    }
  }
}));
