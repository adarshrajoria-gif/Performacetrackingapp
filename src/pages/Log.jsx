import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, Loader, Check, X, Edit2, Filter } from 'lucide-react';
import { addActivity as dsAddActivity, deleteActivity as dsDeleteActivity, updateActivity as dsUpdateActivity } from '../utils/dataService';
import { generateId, todayStr, formatDate, normalizeDate, CHART_COLORS, getPlatformIcon, collectStages, getStageValue } from '../utils/helpers';

const DEFAULT_FUNNEL = ['Outreach', 'Responses', 'Conversions'];

function EditableSelect({ value, onChange, options, placeholder, allowCustom = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const allOpts = useMemo(() => {
    const set = new Set([...options]);
    if (value && !set.has(value)) set.add(value);
    return [...set];
  }, [options, value]);

  return (
    <div className="relative">
      <div
        className="input cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-gray-100' : 'text-gray-500'}>{value || placeholder}</span>
        <ChevronDown size={12} className="text-gray-500 flex-shrink-0" />
      </div>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 overflow-hidden max-h-44 overflow-y-auto">
          {allOpts.map((o) => (
            <div
              key={o}
              onClick={() => { onChange(o); setIsOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-700 ${value === o ? 'text-cyan-400 bg-gray-700/50' : 'text-gray-200'}`}
            >
              {o}
            </div>
          ))}
          {allowCustom && (
            <div className="border-t border-gray-700 p-2">
              <input
                className="input text-xs"
                placeholder="Type custom & press Enter..."
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  // Optional: also push value up as they type
                  // onChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (custom.trim()) {
                      onChange(custom.trim());
                      setCustom('');
                      setIsOpen(false);
                    }
                  }
                }}
                onBlur={() => {
                  if (custom.trim()) {
                    onChange(custom.trim());
                    setCustom('');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inline-editable table row ────────────────────────────────────────────────

function getStagesForActivity(activity, initiatives) {
  const init = initiatives.find(i => i.id === activity.initiativeId);
  return init?.funnelStages || [];
}

function EditableRow({ activity, initiatives, onSave, onCancel, saving }) {
  const stages = getStagesForActivity(activity, initiatives);

  const initialCounts = {};
  stages.forEach(s => { initialCounts[s] = getStageValue(activity, s); });

  const [form, setForm] = useState({
    date: normalizeDate(activity.date) || todayStr(),
    initiativeId: activity.initiativeId,
    title: activity.title || '',
    platform: activity.platform || '',
    activityType: activity.activityType || '',
    stageCounts: initialCounts,
    notes: activity.notes || '',
  });

  const currentStages = (() => {
    const init = initiatives.find(i => i.id === form.initiativeId);
    return init?.funnelStages?.length > 0 ? init.funnelStages : DEFAULT_FUNNEL;
  })();

  const handleSave = () => {
    onSave(activity.id, form);
  };

  return (
    <tr className="table-row text-xs bg-gray-800/40">
      <td className="px-2 py-1.5">
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
          className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-200 font-mono w-[120px] focus:border-cyan-500 outline-none" />
      </td>
      <td className="px-2 py-1.5">
        <select value={form.initiativeId} onChange={e => setForm({ ...form, initiativeId: e.target.value })}
          className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-200 max-w-[110px] focus:border-cyan-500 outline-none">
          <option value="">—</option>
          {initiatives.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </td>
      <td className="px-2 py-1.5">
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-200 w-[120px] focus:border-cyan-500 outline-none"
          placeholder="Title/Identifier" />
      </td>
      <td className="px-2 py-1.5">
        <input value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
          className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-200 w-[90px] focus:border-cyan-500 outline-none"
          placeholder="Platform" />
      </td>
      <td className="px-2 py-1.5">
        <input value={form.activityType} onChange={e => setForm({ ...form, activityType: e.target.value })}
          className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-200 w-[90px] focus:border-cyan-500 outline-none"
          placeholder="Type" />
      </td>
      {currentStages.map((stage, idx) => (
        <td key={stage} className="px-2 py-1.5">
          <input type="number" min="0" value={form.stageCounts[stage] || 0}
            onChange={e => setForm({ ...form, stageCounts: { ...form.stageCounts, [stage]: +e.target.value } })}
            className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs font-mono w-[55px] focus:border-cyan-500 outline-none"
            style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }} />
        </td>
      ))}
      <td className="px-2 py-1.5">
        <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          className="bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-300 w-[120px] focus:border-cyan-500 outline-none"
          placeholder="Notes..." />
      </td>
      <td className="px-2 py-1.5">
        <div className="flex gap-1">
          <button onClick={handleSave} disabled={saving}
            className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
            {saving ? <Loader size={11} className="animate-spin" /> : <Check size={11} />}
          </button>
          <button onClick={onCancel} disabled={saving}
            className="p-1 rounded bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors disabled:opacity-50">
            <X size={11} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Display-only table row ───────────────────────────────────────────────────

const PlatformIconWrapper = ({ platform }) => {
  return React.createElement(getPlatformIcon(platform), { size: 12, className: "text-gray-400" });
};

function DisplayRow({ activity, stages, onEdit, onDelete, deletingId }) {
  return (
    <tr
      className="table-row text-xs cursor-pointer hover:bg-gray-800/60 transition-colors group"
      onDoubleClick={() => onEdit(activity.id)}
    >
      <td className="px-3 py-2.5 text-gray-400 font-mono whitespace-nowrap">{formatDate(activity.date)}</td>
      <td className="px-3 py-2.5">
        <span className="text-gray-100 font-medium">{activity.title || 'Untitled'}</span>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <PlatformIconWrapper platform={activity.platform} />
          <span className="badge bg-gray-800 text-gray-300 border border-gray-700">{activity.platform}</span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{activity.activityType}</span>
      </td>
      {stages.map((stage, idx) => (
        <td key={stage} className="px-3 py-2.5 font-mono font-semibold" style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}>
          {getStageValue(activity, stage)}
        </td>
      ))}
      <td className="px-3 py-2.5 text-gray-500 max-w-[180px] truncate">{activity.notes || '—'}</td>
      <td className="px-3 py-2.5 text-right pr-6">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(activity.id); }}
            className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            title="Edit"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}
            disabled={deletingId === activity.id}
            className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            title="Delete"
          >
            {deletingId === activity.id ? <Loader size={11} className="animate-spin" /> : <Trash2 size={11} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Log({ initiatives, activities, refreshData, addToast }) {
  const [selectedId, setSelectedId] = useState(initiatives[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [manual, setManual] = useState({
    title: '',
    date: todayStr(),
    platform: '',
    activityType: '',
    stageCounts: {},
    notes: '',
  });

  // Automatically update the selectedId if it's empty and initiatives become available
  useEffect(() => {
    if (!selectedId && initiatives.length > 0) {
      setSelectedId(initiatives[0].id);
    }
  }, [initiatives, selectedId]);

  // Filter activities for table
  const filteredActivities = useMemo(() => {
    return activities.filter(a => a.initiativeId === selectedId);
  }, [activities, selectedId]);

  // Get stages for the current view
  const allStages = useMemo(() => collectStages(initiatives, selectedId), [initiatives, selectedId]);

  // Get stages for currently selected initiative
  const selectedInitiative = initiatives.find((i) => i.id === selectedId);
  const manualStages = allStages;
  const manualPlatforms = selectedInitiative ? (selectedInitiative.platforms || []) : [];
  const manualTypes = selectedInitiative ? (selectedInitiative.activityTypes || []) : [];

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      addToast('Please select an initiative at the top', 'error');
      return;
    }
    if (!manual.platform || !manual.activityType) {
      addToast('Please fill in both Platform and Activity Type', 'error');
      return;
    }
    setSaving(true);
    try {
      await dsAddActivity({
        id: generateId(),
        initiativeId: selectedId,
        title: manual.title,
        date: manual.date,
        platform: manual.platform,
        activityType: manual.activityType,
        stageCounts: manual.stageCounts,
        notes: manual.notes,
      });
      await refreshData({ silent: true });
      addToast('Activity logged');
      setManual((m) => ({ ...m, title: '', platform: '', activityType: '', stageCounts: {}, notes: '' }));
    } catch (err) {
      addToast('Failed to log activity: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await dsDeleteActivity(id);
      await refreshData({ silent: true });
      addToast('Activity deleted', 'info');
    } catch (err) {
      addToast('Failed to delete activity: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSave = async (id, updates) => {
    setEditSaving(true);
    try {
      await dsUpdateActivity(id, updates);
      await refreshData({ silent: true });
      setEditingId(null);
      addToast('Activity updated');
    } catch (err) {
      addToast('Failed to update activity: ' + err.message, 'error');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Smart Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track your outreach activities</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Viewing Initiative:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="select min-w-[200px] border-cyan-500/30 focus:border-cyan-500 bg-gray-900 shadow-lg shadow-cyan-500/5"
          >
            {initiatives.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      </div>

      {/* Manual Form */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-200">Manual Entry</h2>
        </div>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} className="input" />
            </div>
            <div className="lg:col-span-2">
              <label className="label">Title / Post Name</label>
              <input
                value={manual.title}
                onChange={(e) => setManual({ ...manual, title: e.target.value })}
                className="input"
                placeholder="e.g. LinkedIn Post #1"
              />
            </div>
            <div>
              <label className="label">Platform</label>
              <EditableSelect
                value={manual.platform}
                onChange={(v) => setManual({ ...manual, platform: v })}
                options={manualPlatforms}
                placeholder="Platform..."
              />
            </div>
            <div>
              <label className="label">Activity Type</label>
              <EditableSelect
                value={manual.activityType}
                onChange={(v) => setManual({ ...manual, activityType: v })}
                options={manualTypes}
                placeholder="Type..."
              />
            </div>
          </div>

          {/* Dynamic Stage Count Inputs */}
          <div>
            <label className="label mb-2">Funnel Stage Counts</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {manualStages.map((stage, idx) => (
                <div key={stage}>
                  <label className="text-xs font-medium mb-1 block truncate" style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}>
                    {stage}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manual.stageCounts[stage] || 0}
                    onChange={(e) => setManual({ ...manual, stageCounts: { ...manual.stageCounts, [stage]: +e.target.value } })}
                    className="input font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <input value={manual.notes} onChange={(e) => setManual({ ...manual, notes: e.target.value })} className="input" placeholder="Optional context..." />
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? 'Saving...' : 'Log Activity'}
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-200">
              {selectedInitiative?.name} Activities
            </h3>
          </div>
          <span className="text-xs text-gray-500">{filteredActivities.length} entries · double-click to edit</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="table-header px-3 py-3 text-left whitespace-nowrap">Date</th>
                <th className="table-header px-3 py-3 text-left whitespace-nowrap">Post Name</th>
                <th className="table-header px-3 py-3 text-left whitespace-nowrap">Platform</th>
                <th className="table-header px-3 py-3 text-left whitespace-nowrap">Type</th>
                {allStages.map((stage, idx) => (
                  <th key={stage} className="table-header px-3 py-3 text-left whitespace-nowrap">
                    <span style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}>{stage}</span>
                  </th>
                ))}
                <th className="table-header px-3 py-3 text-left whitespace-nowrap">Notes</th>
                <th className="table-header px-3 py-3 text-right pr-6 w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-600 text-sm">
                    No activities found for this filter.
                  </td>
                </tr>
              ) : [...filteredActivities].reverse().map((a) => {
                const init = initiatives.find((i) => i.id === a.initiativeId);

                if (editingId === a.id) {
                  return (
                    <EditableRow
                      key={a.id}
                      activity={a}
                      initiatives={initiatives}
                      onSave={handleEditSave}
                      onCancel={() => setEditingId(null)}
                      saving={editSaving}
                    />
                  );
                }

                return (
                  <DisplayRow
                    key={a.id}
                    activity={a}
                    initiative={init}
                    stages={allStages}
                    onEdit={setEditingId}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
