import React from "react";
import { useAnalyticsStore } from "../state/useAnalyticsStore";

export default function AnalyticsTables() {
  const { data, loading } = useAnalyticsStore();

  if (loading) return <div className="analytics-tables">Loading tables…</div>;
  if (!data) return <div className="analytics-tables">No table data.</div>;

  return (
    <div className="analytics-tables">
      <div className="table-block">
        <h4>Top ZIPs</h4>
        <pre>{JSON.stringify(data.topZips ?? {}, null, 2)}</pre>
      </div>

      <div className="table-block">
        <h4>Top Domains</h4>
        <pre>{JSON.stringify(data.topDomains ?? {}, null, 2)}</pre>
      </div>
    </div>
  );
}
