import React from "react";
import { useAnalyticsStore } from "../state/useAnalyticsStore";

export default function AnalyticsCharts() {
  const { data, loading } = useAnalyticsStore();

  if (loading) return <div className="analytics-charts">Loading charts…</div>;
  if (!data) return <div className="analytics-charts">No chart data.</div>;

  return (
    <div className="analytics-charts">
      <div className="chart">
        <h4>Requests by Hour</h4>
        <pre>{JSON.stringify(data.requestsByHour ?? {}, null, 2)}</pre>
      </div>

      <div className="chart">
        <h4>Top Categories</h4>
        <pre>{JSON.stringify(data.topCategories ?? {}, null, 2)}</pre>
      </div>
    </div>
  );
}
