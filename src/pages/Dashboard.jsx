import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Activity, Users, Target, ArrowUpRight, ChevronDown } from 'lucide-react';
import {
  computeMetrics, groupByDate, groupByField, responseRateTrend,
  formatDateShort, formatDate, CHART_COLORS, statusColor,
} from '../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs space-y-1">
      <p className="text-gray-400 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-semibold text-gray-100">{p.value}</span></p>
      ))}
    </div>
  );
};

function MetricCard({ label, value, sub, icon: Icon, accent = 'text-cyan-400' }) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-2">
        <span className="metric-label">{label}</span>
        {Icon && <Icon size={14} className={accent} />}
      </div>
      <div className={`metric-value ${accent}`}>{value}</div>
      {sub && <div className="metric-sub mt-1">{sub}</div>}
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="text-gray-700 ml-1">↕</span>;
  return <span className="text-cyan-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function Dashboard({ initiatives, activities }) {
  const [selectedId, setSelectedId] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = useMemo(() => {
    if (selectedId === 'all') return activities;
    return activities.filter((a) => a.initiativeId === selectedId);
  }, [activities, selectedId]);

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);
  const timeData = useMemo(() => groupByDate(filtered).map((d) => ({
    ...d,
    date: formatDateShort(d.date),
  })), [filtered]);
  const platformData = useMemo(() => groupByField(filtered, 'platform'), [filtered]);
  const typeData = useMemo(() => groupByField(filtered, 'activityType'), [filtered]);
  const trendData = useMemo(() => responseRateTrend(filtered).map((d) => ({
    ...d,
    date: formatDateShort(d.date),
  })), [filtered]);

  const funnelData = [
    { name: 'Outreach', value: metrics.outreach, fill: '#06b6d4' },
    { name: 'Responses', value: metrics.responses, fill: '#818cf8' },
    { name: 'Conversions', value: metrics.conversions, fill: '#34d399' },
  ];

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const recentActivities = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    }).slice(0, 10);
  }, [filtered, sortField, sortDir]);

  const initiativeMap = useMemo(() =>
    Object.fromEntries(initiatives.map((i) => [i.id, i])), [initiatives]);

  return (
    <div className="space-y-6">
      {/* Header + Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Outreach & GTM performance overview</p>
        </div>

        {/* Initiative tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedId('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedId === 'all' ? 'tab-active' : 'tab-inactive'}`}
          >
            All Initiatives
          </button>
          {initiatives.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelectedId(i.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedId === i.id ? 'tab-active' : 'tab-inactive'}`}
            >
              {i.name.length > 22 ? i.name.slice(0, 22) + '…' : i.name}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Activities" value={metrics.total} icon={Activity} accent="text-cyan-400" />
        <MetricCard label="Outreach" value={metrics.outreach.toLocaleString()} icon={Users} accent="text-indigo-400" sub="total people reached" />
        <MetricCard label="Responses" value={metrics.responses.toLocaleString()} icon={ArrowUpRight} accent="text-violet-400" />
        <MetricCard label="Conversions" value={metrics.conversions.toLocaleString()} icon={Target} accent="text-emerald-400" />
        <MetricCard
          label="Response Rate"
          value={`${metrics.responseRate}%`}
          icon={TrendingUp}
          accent={metrics.responseRate > 15 ? 'text-emerald-400' : metrics.responseRate > 8 ? 'text-amber-400' : 'text-red-400'}
          sub={`${metrics.responses}/${metrics.outreach}`}
        />
        <MetricCard
          label="Conv. Rate"
          value={`${metrics.conversionRate}%`}
          icon={Target}
          accent={metrics.conversionRate > 5 ? 'text-emerald-400' : metrics.conversionRate > 2 ? 'text-amber-400' : 'text-red-400'}
          sub={`${metrics.conversions}/${metrics.outreach}`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity over time */}
        <div className="card p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Activity Over Time</h3>
          {timeData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Bar dataKey="quantity" name="Outreach" fill="#06b6d4" radius={[3,3,0,0]} />
                <Bar dataKey="responseCount" name="Responses" fill="#818cf8" radius={[3,3,0,0]} />
                <Bar dataKey="conversionCount" name="Conversions" fill="#34d399" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Funnel */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Conversion Funnel</h3>
          <div className="space-y-3 mt-6">
            {funnelData.map((f, i) => {
              const maxVal = funnelData[0].value || 1;
              const width = Math.max(5, Math.round((f.value / maxVal) * 100));
              return (
                <div key={f.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{f.name}</span>
                    <span className="font-mono font-semibold" style={{ color: f.fill }}>{f.value.toLocaleString()}</span>
                  </div>
                  <div className="h-7 bg-gray-800 rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center pl-2 transition-all"
                      style={{ width: `${width}%`, backgroundColor: f.fill + '33', borderLeft: `3px solid ${f.fill}` }}
                    >
                      {i > 0 && funnelData[i-1].value > 0 && (
                        <span className="text-xs font-mono" style={{ color: f.fill }}>
                          {Math.round((f.value / funnelData[i-1].value) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Platform breakdown */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">By Platform</h3>
          {platformData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={platformData} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="quantity" name="Outreach" radius={[0,3,3,0]}>
                  {platformData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity type breakdown */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">By Activity Type</h3>
          {typeData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="quantity"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={35}
                >
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 10, color: '#9ca3af' }}
                  formatter={(val) => val.length > 14 ? val.slice(0, 14) + '…' : val}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Response rate trend */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Response Rate Trend</h3>
          {trendData.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Need more data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={30} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="responseRate"
                  name="Response Rate"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={{ fill: '#818cf8', r: 3 }}
                  unit="%"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">Recent Activities</h3>
          <span className="text-xs text-gray-500">{filtered.length} total — showing last 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {[
                  { field: 'date', label: 'Date' },
                  { field: 'initiativeId', label: 'Initiative' },
                  { field: 'platform', label: 'Platform' },
                  { field: 'activityType', label: 'Type' },
                  { field: 'quantity', label: 'Outreach' },
                  { field: 'responseCount', label: 'Responses' },
                  { field: 'conversionCount', label: 'Conv.' },
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className="table-header px-4 py-3 text-left cursor-pointer hover:text-gray-300 whitespace-nowrap"
                  >
                    {label}<SortIcon field={field} sortField={sortField} sortDir={sortDir} />
                  </th>
                ))}
                <th className="table-header px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-600 text-sm">
                    No activities yet. Head to Smart Log to add some.
                  </td>
                </tr>
              ) : recentActivities.map((a) => {
                const init = initiativeMap[a.initiativeId];
                return (
                  <tr key={a.id} className="table-row">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{formatDate(a.date)}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap max-w-[140px] truncate">
                      {init?.name || a.initiativeId}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-800 text-gray-300 border border-gray-700">{a.platform}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{a.activityType}</span>
                    </td>
                    <td className="px-4 py-3 text-cyan-400 font-mono font-semibold">{a.quantity}</td>
                    <td className="px-4 py-3 text-violet-400 font-mono">{a.responseCount}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono">{a.conversionCount}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{a.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
