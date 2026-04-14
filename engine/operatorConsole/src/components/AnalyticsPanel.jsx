import React, { useEffect } from "react";
import { useAnalyticsStore } from "../state/useAnalyticsStore";

import AnalyticsSummary from "./AnalyticsSummary";
import AnalyticsCharts from "./AnalyticsCharts";
import AnalyticsTables from "./AnalyticsTables";

export default function AnalyticsPanel() {
  const { load } = useAnalyticsStore();

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="analytics-panel">
      <AnalyticsSummary />
      <AnalyticsCharts />
      <AnalyticsTables />
    </div>
  );
}
