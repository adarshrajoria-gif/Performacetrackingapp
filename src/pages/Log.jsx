import { useState, useMemo, useCallback } from 'react';
import { Sparkles, Plus, Trash2, Edit2, Check, X, ChevronDown, Filter, AlertTriangle } from 'lucide-react';
import { parseActivitiesWithAI } from '../utils/api';
import { addActivities, addActivity, updateActivity, deleteActivity, getApiKey } from '../utils/storage';
import { generateId, todayStr, formatDate } from '../utils/helpers';

const PLATFORMS_DEFAULT = ['Reddit', 'LinkedIn', 'Cold Email', 'WhatsApp', 'Community Forums', 'Events', 'In-person', 'Email'];
const TYPES_DEFAULT = ['Post', 'DM', 'Email', 'Demo', 'Follow-up', 'Call', 'Founder Outreach', 'Partnership Pitch', 'Booking'];

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
        <div className="absolute top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 overflow-hidden">
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
                placeholder="Custom value..."
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && custom.trim()) {
                    onChange(custom.trim());
                    setCustom('');
                    setIsOpen(false);
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

function PreviewRow({ row, index, onChange, onRemove, initiatives }) {
  const initiative = initiatives.find((i) => i.id === row.initiativeId);
  const platforms = initiative ? (initiative.platforms || []) : PLATFORMS_DEFAULT;
  const types = initiative ? (initiative.activityTypes || []) : TYPES_DEFAULT;

  return (
    <tr className="table-row text-xs">
      <td className="px-3 py-2">
        <select
          value={row.initiativeId}
          onChange={(e) => onChange(index, 'initiativeId', e.target.value)}
          className="select text-xs"
        >
          {initiatives.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <input type="date" value={row.date} onChange={(e) => onChange(index, 'date', e.target.value)} className="input text-xs" />
      </td>
      <td className="px-3 py-2">
        <EditableSelect
          value={row.platform}
          onChange={(v) => onChange(index, 'platform', v)}
          options={platforms}
          placeholder="Platform"
        />
      </td>
      <td className="px-3 py-2">
        <EditableSelect
          value={row.activityType}
          onChange={(v) => onChange(index, 'activityType', v)}
          options={types}
          placeholder="Type"
        />
      </td>
      <td className="px-3 py-2">
        <input type="number" min="0" value={row.quantity} onChange={(e) => onChange(index, 'quantity', +e.target.value)} className="input text-xs w-16" />
      </td>
      <td className="px-3 py-2">
        <input type="number" min="0" value={row.responseCount} onChange={(e) => onChange(index, 'responseCount', +e.target.value)} className="input text-xs w-16" />
      </td>
      <td className="px-3 py-2">
        <input type="number" min="0" value={row.conversionCount} onChange={(e) => onChange(index, 'conversionCount', +e.target.value)} className="input text-xs w-16" />
      </td>
      <td className="px-3 py-2">
        <input value={row.notes || ''} onChange={(e) => onChange(index, 'notes', e.target.value)} className="input text-xs" placeholder="Notes..." />
      </td>
      <td className="px-3 py-2">
        <button onClick={() => onRemove(index)} className="btn-danger p-1.5"><Trash2 size={12} /></button>
      </td>
    </tr>
  );
}

function ActivityTableRow({ activity, initiatives, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const init = initiatives.find((i) => i.id === activity.initiativeId);

  const startEdit = () => { setDraft({ ...activity }); setEditing(true); };
  const cancelEdit = () => setEditing(false);
  const saveEdit = () => { onUpdate(activity.id, draft); setEditing(false); };

  if (editing && draft) {
    return (
      <tr className="table-row bg-gray-800/50">
        <td className="px-3 py-2">
          <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="input text-xs" />
        </td>
        <td className="px-3 py-2 text-gray-400 text-xs">{init?.name || '—'}</td>
        <td className="px-3 py-2">
          <input value={draft.platform} onChange={(e) => setDraft({ ...draft, platform: e.target.value })} className="input text-xs" />
        </td>
        <td className="px-3 py-2">
          <input value={draft.activityType} onChange={(e) => setDraft({ ...draft, activityType: e.target.value })} className="input text-xs" />
        </td>
        <td className="px-3 py-2">
          <input type="number" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: +e.target.value })} className="input text-xs w-16" />
        </td>
        <td className="px-3 py-2">
          <input type="number" value={draft.responseCount} onChange={(e) => setDraft({ ...draft, responseCount: +e.target.value })} className="input text-xs w-16" />
        </td>
        <td className="px-3 py-2">
          <input type="number" value={draft.conversionCount} onChange={(e) => setDraft({ ...draft, conversionCount: +e.target.value })} className="input text-xs w-16" />
        </td>
        <td className="px-3 py-2">
          <input value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="input text-xs" />
        </td>
        <td className="px-3 py-2 flex gap-1">
          <button onClick={saveEdit} className="btn-primary px-2 py-1 text-xs"><Check size={12} /></button>
          <button onClick={cancelEdit} className="btn-secondary px-2 py-1 text-xs"><X size={12} /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="table-row text-xs">
      <td className="px-3 py-2.5 text-gray-400 font-mono whitespace-nowrap">{formatDate(activity.date)}</td>
      <td className="px-3 py-2.5 text-gray-300 max-w-[120px] truncate">{init?.name || '—'}</td>
      <td className="px-3 py-2.5">
        <span className="badge bg-gray-800 text-gray-300 border border-gray-700">{activity.platform}</span>
      </td>
      <td className="px-3 py-2.5">
        <span className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{activity.activityType}</span>
      </td>
      <td className="px-3 py-2.5 text-cyan-400 font-mono font-semibold">{activity.quantity}</td>
      <td className="px-3 py-2.5 text-violet-400 font-mono">{activity.responseCount}</td>
      <td className="px-3 py-2.5 text-emerald-400 font-mono">{activity.conversionCount}</td>
      <td className="px-3 py-2.5 text-gray-500 max-w-[180px] truncate">{activity.notes || '—'}</td>
      <td className="px-3 py-2.5 flex gap-1">
        <button onClick={startEdit} className="btn-ghost px-2 py-1"><Edit2 size={11} /></button>
        <button onClick={() => onDelete(activity.id)} className="btn-danger px-2 py-1"><Trash2 size={11} /></button>
      </td>
    </tr>
  );
}

export default function Log({ initiatives, activities, onDataChange, apiKey, onNeedApiKey, addToast }) {
  // AI Mode state
  const [aiText, setAiText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [aiError, setAiError] = useState('');

  // Manual form state
  const [manual, setManual] = useState({
    initiativeId: initiatives[0]?.id || '',
    date: todayStr(),
    platform: '',
    activityType: '',
    quantity: 1,
    responseCount: 0,
    conversionCount: 0,
    notes: '',
  });

  // Table filter state
  const [filterInit, setFilterInit] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const handleAiProcess = async () => {
    if (!aiText.trim()) return;
    if (!apiKey) { onNeedApiKey(); return; }
    setParsing(true);
    setAiError('');
    try {
      const result = await parseActivitiesWithAI(aiText, initiatives);
      const enriched = result.map((r) => ({
        ...r,
        id: generateId(),
        quantity: r.quantity || 1,
        responseCount: r.responseCount || 0,
        conversionCount: r.conversionCount || 0,
      }));
      setPreview(enriched);
    } catch (err) {
      if (err.message === 'NO_API_KEY') {
        onNeedApiKey();
      } else {
        setAiError(err.message || 'AI parsing failed. Try manual entry.');
      }
    } finally {
      setParsing(false);
    }
  };

  const handlePreviewChange = (index, field, value) => {
    setPreview((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const handlePreviewRemove = (index) => {
    setPreview((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? null : next;
    });
  };

  const handleConfirmPreview = () => {
    const toSave = preview.map((r) => ({ ...r, id: r.id || generateId() }));
    addActivities(toSave);
    onDataChange();
    addToast(`Added ${toSave.length} activit${toSave.length === 1 ? 'y' : 'ies'} across ${new Set(toSave.map(r => r.initiativeId)).size} initiative(s)`);
    setPreview(null);
    setAiText('');
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manual.initiativeId || !manual.platform || !manual.activityType) {
      addToast('Please fill in initiative, platform, and type', 'error');
      return;
    }
    addActivity({ ...manual, id: generateId() });
    onDataChange();
    addToast('Activity logged');
    setManual((m) => ({ ...m, platform: '', activityType: '', quantity: 1, responseCount: 0, conversionCount: 0, notes: '' }));
  };

  const handleUpdate = (id, updates) => {
    updateActivity(id, updates);
    onDataChange();
    addToast('Activity updated');
  };

  const handleDelete = (id) => {
    deleteActivity(id);
    onDataChange();
    addToast('Activity deleted', 'info');
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const allPlatforms = useMemo(() => {
    const set = new Set(activities.map((a) => a.platform).filter(Boolean));
    return [...set];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return [...activities]
      .filter((a) => {
        if (filterInit !== 'all' && a.initiativeId !== filterInit) return false;
        if (filterPlatform && a.platform !== filterPlatform) return false;
        if (dateFrom && a.date < dateFrom) return false;
        if (dateTo && a.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => {
        let av = a[sortField], bv = b[sortField];
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [activities, filterInit, filterPlatform, dateFrom, dateTo, sortField, sortDir]);

  const selectedInitiative = initiatives.find((i) => i.id === manual.initiativeId);
  const manualPlatforms = selectedInitiative ? (selectedInitiative.platforms || []) : PLATFORMS_DEFAULT;
  const manualTypes = selectedInitiative ? (selectedInitiative.activityTypes || []) : TYPES_DEFAULT;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Smart Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Log outreach activities via AI text or manual form</p>
      </div>

      {/* AI Input */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-gray-200">AI Text Input</h2>
          {!apiKey && (
            <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-auto">
              API key required
            </span>
          )}
        </div>

        {!apiKey && (
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Add your Anthropic API key in{' '}
              <button onClick={onNeedApiKey} className="underline hover:text-amber-200">Settings</button>{' '}
              to enable smart text input. Manual form is always available below.
            </p>
          </div>
        )}

        <textarea
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          rows={5}
          placeholder={`Describe your activities in plain English...\n\nExample: "Today I posted in 3 Reddit communities about the internal tool, sent 12 cold emails to founders, got 4 replies, 2 said they'll try it. Also did a LinkedIn post. For the board game project, reached out to 5 founders on WhatsApp, 2 showed interest, booked 1 demo."`}
          className="input resize-none font-sans text-sm leading-relaxed"
          disabled={!apiKey}
        />

        {aiError && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{aiError}</p>
          </div>
        )}

        <button
          onClick={handleAiProcess}
          disabled={!aiText.trim() || parsing || !apiKey}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={14} />
          {parsing ? 'Processing...' : 'Process with AI'}
        </button>
      </div>

      {/* Preview Table */}
      {preview && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-200">AI Preview — Review & Edit</h3>
              <p className="text-xs text-gray-500 mt-0.5">{preview.length} activit{preview.length === 1 ? 'y' : 'ies'} extracted — edit any field before confirming</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="btn-secondary text-xs">Discard</button>
              <button onClick={handleConfirmPreview} className="btn-primary text-xs flex items-center gap-1.5">
                <Check size={13} />
                Confirm & Save ({preview.length})
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Initiative', 'Date', 'Platform', 'Type', 'Outreach', 'Responses', 'Conv.', 'Notes', ''].map((h) => (
                    <th key={h} className="table-header px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <PreviewRow
                    key={i}
                    row={row}
                    index={i}
                    onChange={handlePreviewChange}
                    onRemove={handlePreviewRemove}
                    initiatives={initiatives}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Form */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-200">Manual Entry</h2>
        </div>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Initiative</label>
              <select value={manual.initiativeId} onChange={(e) => setManual({ ...manual, initiativeId: e.target.value, platform: '', activityType: '' })} className="select">
                <option value="">Select...</option>
                {initiatives.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
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
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Outreach Count</label>
              <input type="number" min="0" value={manual.quantity} onChange={(e) => setManual({ ...manual, quantity: +e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Responses</label>
              <input type="number" min="0" value={manual.responseCount} onChange={(e) => setManual({ ...manual, responseCount: +e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Conversions</label>
              <input type="number" min="0" value={manual.conversionCount} onChange={(e) => setManual({ ...manual, conversionCount: +e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input value={manual.notes} onChange={(e) => setManual({ ...manual, notes: e.target.value })} className="input" placeholder="Optional context..." />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Plus size={14} />
            Log Activity
          </button>
        </form>
      </div>

      {/* Activity Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-200">All Activities</h3>
            <span className="text-xs text-gray-500">{filteredActivities.length} / {activities.length} entries</span>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select value={filterInit} onChange={(e) => setFilterInit(e.target.value)} className="select text-xs w-auto">
              <option value="all">All Initiatives</option>
              {initiatives.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="select text-xs w-auto">
              <option value="">All Platforms</option>
              {allPlatforms.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input text-xs w-36" title="From" />
              <span className="text-gray-600 text-xs">–</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input text-xs w-36" title="To" />
            </div>
            {(filterInit !== 'all' || filterPlatform || dateFrom || dateTo) && (
              <button onClick={() => { setFilterInit('all'); setFilterPlatform(''); setDateFrom(''); setDateTo(''); }} className="btn-ghost text-xs text-amber-400">
                Clear filters
              </button>
            )}
          </div>
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
                  { field: 'responseCount', label: 'Resp.' },
                  { field: 'conversionCount', label: 'Conv.' },
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className="table-header px-3 py-3 text-left cursor-pointer hover:text-gray-300 whitespace-nowrap"
                  >
                    {label}
                    {sortField === field && <span className="text-cyan-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                ))}
                <th className="table-header px-3 py-3 text-left">Notes</th>
                <th className="table-header px-3 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-600 text-sm">
                    No activities found. Adjust filters or log your first activity above.
                  </td>
                </tr>
              ) : filteredActivities.map((a) => (
                <ActivityTableRow
                  key={a.id}
                  activity={a}
                  initiatives={initiatives}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
