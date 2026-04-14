import React from "react";
import { useAnalyticsStore } from "../state/useAnalyticsStore";

export default function AnalyticsSummary() {
  const { data, loading } = useAnalyticsStore();

  if (loading) return <div className="analytics-summary">Loading…</div>;
  if (!data) return <div className="analytics-summary">No analytics loaded.</div>;

  return (
    <div className="analytics-summary">
      <div className="metric">
        <label>Total Requests</label>
        <span>{data.totalRequests ?? "–"}</span>
      </div>

      <div className="metric">
        <label>Unique Domains</label>
        <span>{data.uniqueDomains ?? "–"}</span>
      </div>

      <div className="metric">
        <label>Avg Response Time</label>
        <span>{data.avgResponseMs ?? "–"} ms</span>
      </div>
    </div>
  );
}
