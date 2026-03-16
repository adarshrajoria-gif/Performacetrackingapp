import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Check, X, Tag, Layers, Loader, GitBranch } from 'lucide-react';
import {
  addInitiative, updateInitiative, deleteInitiative,
} from '../utils/dataService';
import { generateId, computeMetrics, statusColor, formatDate, CHART_COLORS } from '../utils/helpers';

const STATUSES = ['active', 'paused', 'completed'];

const DEFAULT_PLATFORMS = [];
const DEFAULT_TYPES = [];
const DEFAULT_FUNNEL = ['Outreach', 'Responses', 'Conversions'];

function TagList({ items, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim();
    if (val && !items.includes(val)) {
      onAdd(val);
      setInput('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="flex items-center gap-1 bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
            {item}
            <button onClick={() => onRemove(item)} className="text-gray-500 hover:text-red-400 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          className="input text-xs flex-1"
        />
        <button onClick={handleAdd} disabled={!input.trim()} className="btn-secondary text-xs px-2.5 disabled:opacity-40">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

// Ordered tag list — maintains insertion order and shows stage numbers
function OrderedTagList({ items, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim();
    if (val && !items.includes(val)) {
      onAdd(val);
      setInput('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span key={item} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] + '33', color: CHART_COLORS[idx % CHART_COLORS.length] }}>
              {idx + 1}
            </span>
            {item}
            <button onClick={() => onRemove(item)} className="text-gray-500 hover:text-red-400 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          className="input text-xs flex-1"
        />
        <button onClick={handleAdd} disabled={!input.trim()} className="btn-secondary text-xs px-2.5 disabled:opacity-40">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

function InitiativeCard({ initiative, activities, onEdit, onDelete, deleting }) {
  const initActivities = activities.filter((a) => a.initiativeId === initiative.id);
  const stages = initiative.funnelStages?.length > 0 ? initiative.funnelStages : DEFAULT_FUNNEL;
  const metrics = computeMetrics(initActivities, stages);

  // Show first 3 stages as metric cards
  const displayStages = stages.slice(0, 3);

  return (
    <div className="card p-5 space-y-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-100 truncate">{initiative.name}</h3>
            <span className={`badge ${statusColor(initiative.status)}`}>{initiative.status}</span>
          </div>
          {initiative.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{initiative.description}</p>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(initiative)} className="btn-ghost p-1.5"><Edit2 size={13} /></button>
          <button onClick={() => onDelete(initiative.id)} disabled={deleting} className="btn-danger p-1.5 disabled:opacity-50">
            {deleting ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>

      {/* Stage Metrics */}
      <div className={`grid gap-2 mb-2`} style={{ gridTemplateColumns: `repeat(${Math.min(stages.length, 3)}, 1fr)` }}>
        {stages.map((stage, idx) => (
          <div key={stage} className="bg-gray-800/50 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold font-mono" style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}>
              {(metrics.stageTotals[stage] || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 truncate" title={stage}>{stage}</div>
          </div>
        ))}
      </div>

      {/* Funnel Stages */}
      {stages.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <GitBranch size={11} className="text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Funnel</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {stages.map((s, idx) => (
              <span key={s} className="flex items-center gap-1">
                <span className="badge text-xs" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] + '15', color: CHART_COLORS[idx % CHART_COLORS.length], border: `1px solid ${CHART_COLORS[idx % CHART_COLORS.length]}30` }}>
                  {s}
                </span>
                {idx < stages.length - 1 && <span className="text-gray-600 text-xs">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Platforms */}
      {initiative.platforms?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Layers size={11} className="text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Platforms</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {initiative.platforms.map((p) => (
              <span key={p} className="badge bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Activity types */}
      {initiative.activityTypes?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={11} className="text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Activity Types</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {initiative.activityTypes.map((t) => (
              <span key={t} className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 pt-1 border-t border-gray-800">
        Created {formatDate(initiative.createdAt)} · {metrics.total} activit{metrics.total === 1 ? 'y' : 'ies'}
      </div>
    </div>
  );
}

function InitiativeModal({ initiative, onSave, onClose, saving }) {
  const isEdit = !!initiative?.id;
  const [form, setForm] = useState({
    name: initiative?.name || '',
    description: initiative?.description || '',
    status: initiative?.status || 'active',
    platforms: initiative?.platforms || [...DEFAULT_PLATFORMS],
    activityTypes: initiative?.activityTypes || [...DEFAULT_TYPES],
    funnelStages: initiative?.funnelStages || [...DEFAULT_FUNNEL],
  });

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...(isEdit ? initiative : {}),
      id: isEdit ? initiative.id : generateId(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      platforms: form.platforms,
      activityTypes: form.activityTypes,
      funnelStages: form.funnelStages,
      createdAt: isEdit ? initiative.createdAt : new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="card max-w-xl w-full p-6 space-y-5 my-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-100">{isEdit ? 'Edit' : 'New'} Initiative</h2>
          <button onClick={onClose} disabled={saving} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div>
          <label className="label">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Initiative name..."
            className="input"
            autoFocus
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this initiative about?"
            rows={3}
            className="input resize-none"
          />
        </div>

        <div>
          <label className="label">Status</label>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setForm({ ...form, status: s })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${form.status === s
                  ? s === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : s === 'paused' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-gray-500/20 text-gray-300 border-gray-500/40'
                  : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-600'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <GitBranch size={12} className="text-gray-400" />
            Funnel Stages
          </label>
          <p className="text-xs text-gray-600 mb-2">Define the stages of your conversion funnel, in order. Each activity will track counts per stage.</p>
          <OrderedTagList
            items={form.funnelStages}
            onAdd={(v) => setForm({ ...form, funnelStages: [...form.funnelStages, v] })}
            onRemove={(v) => setForm({ ...form, funnelStages: form.funnelStages.filter((s) => s !== v) })}
            placeholder="Add stage (e.g. Contacted, Responded, Booked)..."
          />
        </div>

        <div>
          <label className="label">Platforms</label>
          <TagList
            items={form.platforms}
            onAdd={(v) => setForm({ ...form, platforms: [...form.platforms, v] })}
            onRemove={(v) => setForm({ ...form, platforms: form.platforms.filter((p) => p !== v) })}
            placeholder="Add platform (e.g. Reddit)..."
          />
        </div>

        <div>
          <label className="label">Activity Types</label>
          <TagList
            items={form.activityTypes}
            onAdd={(v) => setForm({ ...form, activityTypes: [...form.activityTypes, v] })}
            onRemove={(v) => setForm({ ...form, activityTypes: form.activityTypes.filter((t) => t !== v) })}
            placeholder="Add type (e.g. Cold DM)..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={saving} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={!form.name.trim() || saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Initiative'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Initiatives({ initiatives, activities, refreshData, addToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() =>
    filterStatus === 'all' ? initiatives : initiatives.filter((i) => i.status === filterStatus),
    [initiatives, filterStatus]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (data.id && initiatives.find((i) => i.id === data.id)) {
        await updateInitiative(data.id, data);
        addToast('Initiative updated');
      } else {
        await addInitiative(data);
        addToast('Initiative created');
      }
      setShowModal(false);
      await refreshData({ silent: true });
    } catch (err) {
      addToast('Failed to save initiative: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this initiative and all its activities?')) return;
    setDeletingId(id);
    try {
      await deleteInitiative(id);
      addToast('Initiative deleted', 'info');
      await refreshData({ silent: true });
    } catch (err) {
      addToast('Failed to delete initiative: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (initiative) => {
    setEditTarget(initiative);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditTarget(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Initiatives</h1>
          <p className="text-sm text-gray-500 mt-0.5">{initiatives.length} initiative{initiatives.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {['all', ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <button onClick={handleNew} className="btn-primary flex items-center gap-2">
            <Plus size={14} />
            New Initiative
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-600 text-sm mb-4">No initiatives yet.</p>
          <button onClick={handleNew} className="btn-primary inline-flex items-center gap-2">
            <Plus size={14} />
            Create your first initiative
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((i) => (
            <InitiativeCard
              key={i.id}
              initiative={i}
              activities={activities}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deleting={deletingId === i.id}
            />
          ))}
        </div>
      )}

      {showModal && (
        <InitiativeModal
          initiative={editTarget}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
