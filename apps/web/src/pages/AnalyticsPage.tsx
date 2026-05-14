import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useAnalytics } from "../lib/hooks";
import { useWorkspaceStore } from "../store/workspace.store";
import { useAnalyticsSummary } from "../lib/hooks";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function AnalyticsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const {
    mutate: getSummary,
    data: summaryData,
    isPending: summarizing,
  } = useAnalyticsSummary();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });

  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const { data, isLoading, error } = useAnalytics(slug ?? null, from, to);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load analytics.</p>
      </div>
    );
  }

  const deviceData = data.byDevice.map((d: any) => ({
    name: d.name,
    value: d.count,
  }));

  const browserData = data.byBrowser.map((d: any) => ({
    name: d.name,
    clicks: d.count,
  }));

  const countryData = data.byCountry.map((d: any) => ({
    name: d.name,
    clicks: d.count,
  }));
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);
  const handleExport = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/api/links/${slug}/analytics/export?workspaceId=${workspaceId}`,
      "_blank",
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          />

          <span className="text-gray-400 text-sm">to</span>

          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          />

          <button
            onClick={handleExport}
            className="text-sm border rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => getSummary(data)}
            disabled={summarizing || !data}
            className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-40"
          >
            {summarizing ? "Analysing..." : "✦ AI Summary"}
          </button>
        </div>
        <h1 className="text-lg font-semibold">Analytics — /{slug}</h1>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {summaryData?.summary && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-600 text-sm">✦</span>
              <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                AI Insight
              </p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {summaryData.summary}
            </p>
          </div>
        )}
        {/* Stat card */}
        <div className="bg-white border rounded-xl p-6">
          <p className="text-sm text-gray-500 mb-1">Total clicks</p>
          <p className="text-4xl font-semibold">{data.totalClicks}</p>
        </div>

        {/* Daily clicks line chart */}
        {data.byDay?.length > 0 && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">
              Clicks over time
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.byDay}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device donut */}
          {deviceData.length > 0 && (
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-sm font-medium text-gray-700 mb-4">
                Device type
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({
                      name,
                      percent,
                    }: {
                      name: string;
                      percent: number;
                    }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Browser bar chart */}
          {browserData.length > 0 && (
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-sm font-medium text-gray-700 mb-4">
                Browsers
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={browserData} layout="vertical">
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top countries */}
        {countryData.length > 0 && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">
              Top countries
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={countryData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top referrers */}
        {data.byReferrer?.length > 0 && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">
              Top referrers
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 font-medium">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.byReferrer.map((r: any) => (
                  <tr key={r.name}>
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 font-medium">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
