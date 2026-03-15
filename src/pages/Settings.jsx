import { useState } from 'react';
import { Key, Download, Upload, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { getApiKey, setApiKey, clearApiKey, exportData, importData, setInitiatives, setActivities } from '../utils/storage';
import { seedInitiatives, seedActivities } from '../utils/seedData';

export default function Settings({ onDataChange, addToast, apiKey, setCurrentApiKey }) {
  const [key, setKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(!!apiKey);

  const handleSaveKey = () => {
    const trimmed = key.trim();
    if (!trimmed) {
      clearApiKey();
      setCurrentApiKey(null);
      setKeySaved(false);
      addToast('API key removed', 'info');
      return;
    }
    setApiKey(trimmed);
    setCurrentApiKey(trimmed);
    setKeySaved(true);
    addToast('API key saved');
  };

  const handleClearKey = () => {
    clearApiKey();
    setKey('');
    setCurrentApiKey(null);
    setKeySaved(false);
    addToast('API key cleared', 'info');
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
    reader.onload = (ev) => {
      try {
        importData(ev.target.result);
        onDataChange();
        addToast('Data imported successfully');
      } catch {
        addToast('Import failed — invalid file format', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReseed = () => {
    if (!confirm('This will REPLACE all data with fresh seed data. Continue?')) return;
    setInitiatives(seedInitiatives);
    setActivities(seedActivities);
    onDataChange();
    addToast('Seed data reloaded');
  };

  const handleClearAll = () => {
    if (!confirm('This will permanently delete ALL initiatives and activities. Are you sure?')) return;
    setInitiatives([]);
    setActivities([]);
    onDataChange();
    addToast('All data cleared', 'info');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage API key, data, and preferences</p>
      </div>

      {/* API Key */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-gray-200">Anthropic API Key</h2>
          {keySaved && apiKey ? (
            <span className="badge badge-active ml-auto">Active</span>
          ) : (
            <span className="badge badge-paused ml-auto">Not set</span>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Required for AI text parsing in Smart Log. Stored only in your browser's localStorage.
          Get your key from{' '}
          <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
            console.anthropic.com
          </a>.
        </p>

        {!apiKey && (
          <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">No API key set. Smart Log AI input is disabled. Manual form is always available.</p>
          </div>
        )}

        <div>
          <label className="label">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => { setKey(e.target.value); setKeySaved(false); }}
              placeholder="sk-ant-..."
              className="input pr-10 font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSaveKey} className="btn-primary flex items-center gap-1.5">
            <CheckCircle size={14} />
            {key.trim() ? 'Save Key' : 'Clear Key'}
          </button>
          {apiKey && (
            <button onClick={handleClearKey} className="btn-danger">Remove Key</button>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Download size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-200">Data Management</h2>
        </div>
        <p className="text-xs text-gray-500">All data is stored in your browser's localStorage. Export regularly to back up your data.</p>

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

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-sm text-gray-300 font-medium">Reload Seed Data</p>
              <p className="text-xs text-gray-500 mt-0.5">Replace all data with the built-in demo data</p>
            </div>
            <button onClick={handleReseed} className="btn-secondary flex items-center gap-1.5 text-xs flex-shrink-0">
              <RefreshCw size={12} />
              Reseed
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-sm text-gray-300 font-medium">Clear All Data</p>
              <p className="text-xs text-gray-500 mt-0.5">Permanently delete all initiatives and activities</p>
            </div>
            <button onClick={handleClearAll} className="btn-danger flex items-center gap-1.5 flex-shrink-0">
              <Trash2 size={12} />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-5 space-y-2">
        <h2 className="text-sm font-semibold text-gray-200">About</h2>
        <p className="text-xs text-gray-500">Initiative Tracker · Built with React, Vite, Tailwind, Recharts</p>
        <p className="text-xs text-gray-600">No backend · All data in localStorage · AI via Anthropic claude-sonnet-4-20250514</p>
      </div>
    </div>
  );
}
