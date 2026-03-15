export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const todayStr = () => new Date().toISOString().split('T')[0];

export const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export const pct = (num, den) => {
  if (!den) return 0;
  return Math.round((num / den) * 100);
};

export const computeMetrics = (activities) => {
  const total = activities.length;
  const outreach = activities.reduce((s, a) => s + (a.quantity || 0), 0);
  const responses = activities.reduce((s, a) => s + (a.responseCount || 0), 0);
  const conversions = activities.reduce((s, a) => s + (a.conversionCount || 0), 0);
  const responseRate = pct(responses, outreach);
  const conversionRate = pct(conversions, outreach);
  return { total, outreach, responses, conversions, responseRate, conversionRate };
};

// Group activities by date for time-series chart
export const groupByDate = (activities) => {
  const map = {};
  activities.forEach((a) => {
    const d = a.date;
    if (!map[d]) map[d] = { date: d, quantity: 0, responseCount: 0, conversionCount: 0, count: 0 };
    map[d].quantity += a.quantity || 0;
    map[d].responseCount += a.responseCount || 0;
    map[d].conversionCount += a.conversionCount || 0;
    map[d].count += 1;
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
};

// Group by field (platform or activityType)
export const groupByField = (activities, field) => {
  const map = {};
  activities.forEach((a) => {
    const key = a[field] || 'Unknown';
    if (!map[key]) map[key] = { name: key, quantity: 0, responseCount: 0, conversionCount: 0, count: 0 };
    map[key].quantity += a.quantity || 0;
    map[key].responseCount += a.responseCount || 0;
    map[key].conversionCount += a.conversionCount || 0;
    map[key].count += 1;
  });
  return Object.values(map).sort((a, b) => b.quantity - a.quantity);
};

// Rolling response rate over time
export const responseRateTrend = (activities) => {
  const byDate = groupByDate(activities);
  let cumOut = 0, cumResp = 0;
  return byDate.map((d) => {
    cumOut += d.quantity;
    cumResp += d.responseCount;
    return { date: d.date, responseRate: pct(cumResp, cumOut), quantity: d.quantity };
  });
};

export const CHART_COLORS = [
  '#06b6d4', '#818cf8', '#34d399', '#fb923c', '#f472b6',
  '#a78bfa', '#fbbf24', '#4ade80', '#38bdf8', '#f87171',
];

export const statusColor = (status) => {
  if (status === 'active') return 'badge-active';
  if (status === 'paused') return 'badge-paused';
  return 'badge-completed';
};
