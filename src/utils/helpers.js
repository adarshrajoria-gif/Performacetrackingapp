import {
  Linkedin, Twitter, MessageCircle, Mail, Phone, Globe, Facebook, Instagram, Send, Star, Zap, Activity as ActivityIcon
} from 'lucide-react';

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  let d;
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    d = new Date(dateStr + 'T00:00:00');
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  let d;
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    d = new Date(dateStr + 'T00:00:00');
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const todayStr = () => new Date().toISOString().split('T')[0];

export const normalizeDate = (val) => {
  if (!val) return '';
  // If it's already YYYY-MM-DD
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  // Adjust for timezone offset to get correct date string
  const offset = d.getTimezoneOffset();
  const adjusted = new Date(d.getTime() - (offset * 60 * 1000));
  return adjusted.toISOString().split('T')[0];
};

export const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export const pct = (num, den) => {
  if (!den) return 0;
  return Math.round((num / den) * 100);
};

// ─── Stage-aware metrics ──────────────────────────────────────────────────────

// Get the stage count value from an activity — optimized for O(1) lookup
export const getStageCount = (activity, stageName) => {
  if (!activity || !stageName || typeof stageName !== 'string') return 0;

  // Modern apps strictly use the stageCounts object
  const counts = activity.stageCounts;
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return 0;

  // 1. Direct match (Fastest)
  if (counts[stageName] !== undefined) return Number(counts[stageName]) || 0;

  // 2. Case-insensitive key match
  const normalized = stageName.toLowerCase().trim();
  const keys = Object.keys(counts);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase().trim() === normalized) {
      return Number(counts[keys[i]]) || 0;
    }
  }

  return 0;
};

export const getStageValue = getStageCount;

// Get the first stage count (used as the "total outreach" equivalent)
export const getFirstStageCount = (activity, stages) => {
  if (!stages || stages.length === 0) {
    return activity.quantity || 0;
  }
  return getStageCount(activity, stages[0]);
};

// Compute aggregate metrics for a set of activities, given the funnel stages
export const computeMetrics = (activities, stages) => {
  const total = activities.length;
  const stageList = stages && stages.length > 0 ? stages : ['Outreach', 'Responses', 'Conversions'];

  const stageTotals = {};
  stageList.forEach((stage) => {
    stageTotals[stage] = activities.reduce((s, a) => s + getStageCount(a, stage), 0);
  });

  return { total, stageTotals };
};

// Build funnel data array from stageTotals
export const buildFunnelData = (stageTotals, stages) => {
  const stageList = stages && stages.length > 0 ? stages : Object.keys(stageTotals);
  return stageList.map((stage, i) => ({
    name: stage,
    value: stageTotals[stage] || 0,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
};

// Group activities by date for time-series chart
export const groupByDate = (activities, stages) => {
  const map = {};
  const stageList = stages && stages.length > 0 ? stages : ['Outreach', 'Responses', 'Conversions'];

  activities.forEach((a) => {
    const d = a.date;
    if (!map[d]) {
      map[d] = { date: d, count: 0 };
      stageList.forEach(s => { map[d][s] = 0; });
    }
    stageList.forEach(s => {
      map[d][s] += getStageCount(a, s);
    });
    map[d].count += 1;
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
};

// Group by field (platform or activityType)
export const groupByField = (activities, field, stages) => {
  const map = {};
  const stageList = stages && stages.length > 0 ? stages : ['Outreach', 'Responses', 'Conversions'];
  const firstStage = stageList[0];

  activities.forEach((a) => {
    const key = a[field] || 'Unknown';
    if (!map[key]) {
      map[key] = { name: key, count: 0 };
      stageList.forEach(s => { map[key][s] = 0; });
    }
    stageList.forEach(s => {
      map[key][s] += getStageCount(a, s);
    });
    map[key].count += 1;
  });
  return Object.values(map).sort((a, b) => (b[firstStage] || 0) - (a[firstStage] || 0));
};

// Conversion rate trend (first stage → last stage)
export const conversionTrend = (activities, stages) => {
  const stageList = stages && stages.length > 0 ? stages : ['Outreach', 'Responses', 'Conversions'];
  const firstStage = stageList[0];
  const lastStage = stageList[stageList.length - 1];

  const byDate = groupByDate(activities, stageList);
  let cumFirst = 0, cumLast = 0;
  return byDate.map((d) => {
    cumFirst += d[firstStage] || 0;
    cumLast += d[lastStage] || 0;
    return { date: d.date, conversionRate: pct(cumLast, cumFirst) };
  });
};

// Get funnel stages for a specific initiative or all
export const collectStages = (initiatives, selectedId) => {
  const DEFAULT = ['Outreach', 'Responses', 'Conversions'];

  if (selectedId && selectedId !== 'all') {
    const init = initiatives.find(i => i.id === selectedId);
    if (init) {
      const iStages = (init.funnelStages && Array.isArray(init.funnelStages)) ? init.funnelStages : [];
      // Use custom funnel if it has any stages, otherwise fallback to default
      const filtered = iStages.filter(s => s && typeof s === 'string');
      return filtered.length > 0 ? filtered : DEFAULT;
    }
    return DEFAULT;
  }

  // For "all" or missing selection, collect union of all unique stages defined in active initiatives
  const seenHeader = new Set();
  const stages = [];
  initiatives.forEach(i => {
    const iStages = (i.funnelStages && Array.isArray(i.funnelStages)) ? i.funnelStages : DEFAULT;
    iStages.forEach(s => {
      if (s && typeof s === 'string') {
        const normalized = s.toLowerCase().trim();
        if (!seenHeader.has(normalized)) {
          seenHeader.add(normalized);
          stages.push(s);
        }
      }
    });
  });
  return stages.length > 0 ? stages : DEFAULT;
};

// Ensure activity has object-based stageCounts, stripped of extra fields
export const normalizeActivity = (a) => {
  if (!a) return a;
  const baseKeys = ['id', 'initiativeId', 'date', 'platform', 'activityType', 'title', 'notes'];

  const clean = {
    stageCounts: (a.stageCounts && typeof a.stageCounts === 'object' && !Array.isArray(a.stageCounts))
      ? { ...a.stageCounts }
      : {}
  };

  baseKeys.forEach(k => { clean[k] = a[k] || ''; });
  return clean;
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

export const PLATFORM_ICONS = {
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  reddit: MessageCircle,
  email: Mail,
  whatsapp: Phone,
  facebook: Facebook,
  instagram: Instagram,
  telegram: Send,
  outreach: Zap,
  direct: Star,
  other: ActivityIcon,
};

export const getPlatformIcon = (platform) => {
  if (!platform || typeof platform !== 'string') return PLATFORM_ICONS.other;
  const key = platform.toLowerCase().trim();
  return PLATFORM_ICONS[key] || PLATFORM_ICONS.other;
};
