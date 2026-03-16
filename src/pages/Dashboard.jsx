import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity, Target, ArrowUpRight, TrendingUp } from 'lucide-react';
import {
  computeMetrics, groupByDate, groupByField, conversionTrend,
  buildFunnelData, collectStages, getStageCount,
  formatDateShort, formatDate, CHART_COLORS, statusColor, pct,
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

function MetricCard({ label, value, sub, icon: Icon, color = '#06b6d4' }) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-2">
        <span className="metric-label">{label}</span>
        {Icon && <Icon size={14} style={{ color }} />}
      </div>
      <div className="metric-value" style={{ color }}>{value}</div>
      {sub && <div className="metric-sub mt-1">{sub}</div>}
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="text-gray-700 ml-1">↕</span>;
  return <span className="text-cyan-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function Dashboard({ initiatives, activities }) {
  const [selectedId, setSelectedId] = useState(initiatives[0]?.id || 'all');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = useMemo(() => {
    const raw = selectedId === 'all' ? activities : activities.filter((a) => a.initiativeId === selectedId);
    return raw;
  }, [activities, selectedId]);

  const stages = useMemo(() => collectStages(initiatives, selectedId), [initiatives, selectedId]);

  const metrics = useMemo(() => computeMetrics(filtered, stages), [filtered, stages]);
  const timeData = useMemo(() => groupByDate(filtered, stages).map((d) => ({
    ...d,
    date: formatDateShort(d.date),
  })), [filtered, stages]);
  const platformData = useMemo(() => groupByField(filtered, 'platform', stages), [filtered, stages]);
  const typeData = useMemo(() => groupByField(filtered, 'activityType', stages), [filtered, stages]);
  const trendData = useMemo(() => conversionTrend(filtered, stages).map((d) => ({
    ...d,
    date: formatDateShort(d.date),
  })), [filtered, stages]);

  const funnelData = useMemo(() => buildFunnelData(metrics.stageTotals, stages), [metrics, stages]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const recentActivities = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (stages.includes(sortField)) {
        av = getStageCount(a, sortField);
        bv = getStageCount(b, sortField);
      } else {
        av = a[sortField];
        bv = b[sortField];
      }

      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    }).slice(0, 10);
  }, [filtered, sortField, sortDir, stages]);

  const initiativeMap = useMemo(() => {
    const map = {};
    for (let i = 0; i < initiatives.length; i++) {
      map[initiatives[i].id] = initiatives[i];
    }
    return map;
  }, [initiatives]);

  // For metric cards, show all stages + conversion rate
  const firstStage = stages[0] || 'Outreach';
  const lastStage = stages[stages.length - 1] || 'Conversions';
  const firstTotal = metrics.stageTotals[firstStage] || 0;
  const lastTotal = metrics.stageTotals[lastStage] || 0;
  const convRate = pct(lastTotal, firstTotal);

  if (initiatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-6">
          <Activity className="text-cyan-400" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-100">Welcome to Performance Tracker</h1>
        <p className="text-gray-500 mt-2 max-w-md">
          To get started, you'll need to create your first initiative and define your funnel stages.
        </p>
        <button
          onClick={() => window.location.href = '/initiatives'}
          className="mt-8 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/20"
        >
          Create First Initiative
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Outreach & GTM performance overview</p>
        </div>

        <div className="flex flex-wrap gap-2">
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

      {/* Metric Cards — dynamic based on stages */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[140px] flex-1">
          <MetricCard label="Activities" value={metrics.total} icon={Activity} color="#06b6d4" />
        </div>
        {stages.map((stage, idx) => (
          <div key={stage} className="min-w-[140px] flex-1">
            <MetricCard
              label={stage}
              value={(metrics.stageTotals[stage] || 0).toLocaleString()}
              icon={idx === 0 ? ArrowUpRight : idx === stages.length - 1 ? Target : TrendingUp}
              color={CHART_COLORS[idx % CHART_COLORS.length]}
            />
          </div>
        ))}
        <div className="min-w-[140px] flex-1">
          <MetricCard
            label={`${lastStage} Rate`}
            value={`${convRate}%`}
            icon={Target}
            color={convRate > 10 ? '#34d399' : convRate > 5 ? '#fbbf24' : '#f87171'}
            sub={`${lastTotal}/${firstTotal}`}
          />
        </div>
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
                {stages.map((stage, idx) => (
                  <Bar key={stage} dataKey={stage} name={stage} fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Funnel */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Conversion Funnel</h3>
          <div className="space-y-3 mt-2">
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
                      {i > 0 && funnelData[i - 1].value > 0 && (
                        <span className="text-xs font-mono" style={{ color: f.fill }}>
                          {Math.round((f.value / funnelData[i - 1].value) * 100)}%
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
                <Bar dataKey={firstStage} name={firstStage} radius={[0, 3, 3, 0]}>
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
                  dataKey={firstStage}
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

        {/* Conversion rate trend */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">{lastStage} Rate Trend</h3>
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
                  dataKey="conversionRate"
                  name={`${lastStage} Rate`}
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
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className="table-header px-4 py-3 text-left cursor-pointer hover:text-gray-300 whitespace-nowrap"
                  >
                    {label}<SortIcon field={field} sortField={sortField} sortDir={sortDir} />
                  </th>
                ))}
                {stages.map((stage, idx) => (
                  <th key={stage} className="table-header px-4 py-3 text-left whitespace-nowrap">
                    <span style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}>{stage}</span>
                  </th>
                ))}
                <th className="table-header px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={5 + stages.length} className="px-4 py-8 text-center text-gray-600 text-sm">
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
                    {stages.map((stage, idx) => (
                      <td key={stage} className="px-4 py-3 font-mono font-semibold" style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}>
                        {getStageCount(a, stage)}
                      </td>
                    ))}
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
