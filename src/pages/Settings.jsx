import { useState } from 'react';
import { Download, Upload, Trash2, Database, CheckCircle, Table, Copy, Check, Loader, RefreshCw } from 'lucide-react';
import { exportData, setSupabaseConfig, clearSupabaseConfig, getSupabaseConfig } from '../utils/storage';
import { clearAllData, importData as dsImportData } from '../utils/dataService';
import { getSupabase } from '../utils/supabaseClient';

export default function Settings({ refreshData, addToast, onSupabaseConfigSave, supabaseConnected }) {
  const config = getSupabaseConfig();
  const [urlInput, setUrlInput] = useState(config.url || '');
  const [keyInput, setKeyInput] = useState(config.key || '');
  const [configSaved, setConfigSaved] = useState(!!(config.url && config.key));
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Define SQL schema block
  // Define SQL schema block
  const SQL_SCHEMA = `-- 1) initiatives
CREATE TABLE initiatives (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 description text,
 status text DEFAULT 'active',
 "createdAt" date DEFAULT now(),
 "exportedAt" timestamptz
);

-- 2) lookup tables
CREATE TABLE platforms ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL );
CREATE TABLE activity_types ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL );
CREATE TABLE funnel_stages ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL );

-- 3) Join tables
CREATE TABLE initiative_platforms (
 initiative_id uuid REFERENCES initiatives(id) ON DELETE CASCADE,
 platform_id uuid REFERENCES platforms(id) ON DELETE CASCADE,
 PRIMARY KEY (initiative_id, platform_id)
);
CREATE TABLE initiative_activity_types (
 initiative_id uuid REFERENCES initiatives(id) ON DELETE CASCADE,
 activity_type_id uuid REFERENCES activity_types(id) ON DELETE CASCADE,
 PRIMARY KEY (initiative_id, activity_type_id)
);
CREATE TABLE initiative_funnel_stages (
 initiative_id uuid REFERENCES initiatives(id) ON DELETE CASCADE,
 funnel_stage_id uuid REFERENCES funnel_stages(id) ON DELETE CASCADE,
 PRIMARY KEY (initiative_id, funnel_stage_id)
);

-- 4) activities
CREATE TABLE activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
 date date DEFAULT now(),
 platform text,
 activity_type text,
 title text,
 notes text
);

-- 5) stage counts
CREATE TABLE activity_stage_counts (
 activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
 funnel_stage_id uuid NOT NULL REFERENCES funnel_stages(id) ON DELETE CASCADE,
 count integer NOT NULL DEFAULT 0,
 PRIMARY KEY (activity_id, funnel_stage_id)
);`;

  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SQL_SCHEMA).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const handleSaveConfig = () => {
    const trimmedUrl = urlInput.trim();
    const trimmedKey = keyInput.trim();

    if (!trimmedUrl || !trimmedKey) {
      clearSupabaseConfig();
      onSupabaseConfigSave();
      setConfigSaved(false);
      addToast('Supabase disconnected', 'info');
      return;
    }

    setSupabaseConfig(trimmedUrl, trimmedKey);
    onSupabaseConfigSave();
    setConfigSaved(true);
    addToast('Supabase config saved');
  };

  const handleTestConnection = async () => {
    if (!supabaseConnected) return;
    setTesting(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Client not initialized');

      const { error } = await supabase.from('initiatives').select('id', { count: 'exact', head: true });
      if (error) throw error;

      const { error: actError } = await supabase.from('activities').select('id', { count: 'exact', head: true });
      if (actError) throw actError;

      addToast(`Connected to Supabase successfully`);
    } catch (err) {
      addToast('Connection failed: ' + err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await refreshData({ showSuccess: true });
    } catch {
      addToast('Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `initiative-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Data exported');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        await dsImportData(data.initiatives || [], data.activities || []);
        await refreshData({ silent: true });
        addToast('Data imported successfully');
      } catch {
        addToast('Import failed — invalid file format', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = async () => {
    if (!confirm('This will permanently delete ALL initiatives and activities. Are you sure?')) return;
    setClearing(true);
    try {
      await clearAllData();
      await refreshData({ silent: true });
      addToast('All data cleared', 'info');
    } catch (err) {
      addToast('Failed to clear data: ' + err.message, 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage Supabase database and data storage</p>
      </div>

      {/* Supabase */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-gray-200">Supabase Database Backend</h2>
          {configSaved && urlInput && keyInput ? (
            <span className="badge badge-active ml-auto flex items-center gap-1">
              Connected
            </span>
          ) : (
            <span className="badge badge-paused ml-auto">Not connected</span>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Connect a Supabase project to store all data in the cloud. Supabase is the <strong className="text-gray-400">primary backend</strong> — all reads and writes go to the database first, with localStorage as a fallback.
        </p>

        {/* Setup Instructions */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 space-y-3">
          <p className="text-xs font-medium text-gray-300">Setup (one-time)</p>
          <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
            <li>Create a new project on <a href="https://supabase.com/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Supabase</a></li>
            <li>Go to the <span className="text-gray-200">SQL Editor</span> and execute the script below</li>
            <li>Go to <span className="text-gray-200">Project Settings → API</span> and copy your URL and anon key</li>
            <li>Paste them below</li>
          </ol>

          <div className="relative">
            <pre className="text-xs text-gray-400 bg-gray-900 rounded p-3 overflow-x-auto max-h-40 font-mono leading-relaxed whitespace-pre">
              {SQL_SCHEMA}
            </pre>
            <button
              onClick={handleCopyCode}
              className="absolute top-2 right-2 btn-secondary text-xs flex items-center gap-1 px-2 py-1"
            >
              {codeCopied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Project URL</label>
            <input
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setConfigSaved(false); }}
              placeholder="https://xyz.supabase.co"
              className="input font-mono text-xs"
            />
          </div>
          <div>
            <label className="label">Anon Key (public)</label>
            <input
              value={keyInput}
              onChange={(e) => { setKeyInput(e.target.value); setConfigSaved(false); }}
              placeholder="eyJhbGciOiJIUzI1NiIsInR..."
              className="input font-mono text-xs"
              type="password"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={handleSaveConfig} className="btn-primary flex items-center gap-1.5">
            <CheckCircle size={14} />
            {urlInput.trim() && keyInput.trim() ? 'Save & Connect' : 'Disconnect'}
          </button>
          {(urlInput.trim() && keyInput.trim() && configSaved) && (
            <button onClick={handleTestConnection} disabled={testing} className="btn-secondary flex items-center gap-1.5 disabled:opacity-50">
              {testing ? <Loader size={13} className="animate-spin" /> : <Database size={13} />}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          )}
          {supabaseConnected && (
            <button onClick={handleSync} disabled={syncing} className="btn-secondary flex items-center gap-1.5 disabled:opacity-50">
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>

      {/* Team Deployment Status */}
      {import.meta.env.VITE_SUPABASE_URL ? (
        <div className="card p-5 space-y-3 border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-gray-200">Team Configuration Active</h2>
          </div>
          <p className="text-xs text-gray-500">
            This deployment is configured with a global Supabase backend via <code className="text-emerald-400/80">VITE_SUPABASE...</code> env variables.
            All team members will see the same data by default.
          </p>
        </div>
      ) : (
        <div className="card p-5 space-y-3 border-cyan-500/20 bg-cyan-500/[0.02]">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-cyan-400" />
            <h2 className="text-sm font-semibold text-gray-200">Team Sharing</h2>
          </div>
          <p className="text-xs text-gray-500">
            To allow your manager or teammates to see your data automatically, set the <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> environment variables in your Vercel deployment settings.
          </p>
        </div>
      )}

      {/* Data Management */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Download size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-200">Data Management</h2>
        </div>
        <p className="text-xs text-gray-500">Export regularly to back up your data.</p>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2">
            <Download size={14} />
            Export JSON
          </button>
          <label className="btn-secondary flex items-center justify-center gap-2 cursor-pointer">
            <Upload size={14} />
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-5 space-y-4 border-red-500/20">
        <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div>
            <p className="text-sm text-gray-300 font-medium">Clear All Data</p>
            <p className="text-xs text-gray-500 mt-0.5">Permanently delete all initiatives and activities{supabaseConnected ? ' (from Supabase and local cache)' : ''}</p>
          </div>
          <button onClick={handleClearAll} disabled={clearing} className="btn-danger flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50">
            {clearing ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card p-5 space-y-2">
        <h2 className="text-sm font-semibold text-gray-200">About</h2>
        <p className="text-xs text-gray-500">Initiative Tracker · Built with React, Vite, Tailwind, Recharts</p>
        <p className="text-xs text-gray-600">Supabase backend · localStorage fallback</p>
      </div>
    </div>
  );
}

