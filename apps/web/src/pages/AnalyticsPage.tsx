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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function AnalyticsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAnalytics(slug ?? null);

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
    name: d.deviceType,
    value: d._count.deviceType,
  }));

  const browserData = data.byBrowser.map((d: any) => ({
    name: d.browser,
    clicks: d._count.browser,
  }));

  const countryData = data.byCountry.map((d: any) => ({
    name: d.country,
    clicks: d._count.country,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Analytics — /{slug}</h1>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
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
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
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
                  <tr key={r.referrer}>
                    <td className="py-2">{r.referrer}</td>
                    <td className="py-2 font-medium">{r._count.referrer}</td>
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
