import { useState } from 'react';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, Table, Copy, Check, Loader, RefreshCw } from 'lucide-react';
import { exportData, setSheetsUrl, clearSheetsUrl } from '../utils/storage';
import { loadFromSheets, APPS_SCRIPT_CODE } from '../utils/sheetsApi';
import { clearAllData, importData as dsImportData } from '../utils/dataService';

export default function Settings({ refreshData, addToast, sheetsUrl, onSheetsUrlSave, sheetsConnected }) {
  const [sheetInput, setSheetInput] = useState(sheetsUrl || '');
  const [sheetSaved, setSheetSaved] = useState(!!sheetsUrl);
  const [testing, setTesting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSaveSheetsUrl = () => {
    const trimmed = sheetInput.trim();
    if (!trimmed) {
      clearSheetsUrl();
      onSheetsUrlSave('');
      setSheetSaved(false);
      addToast('Google Sheets disconnected', 'info');
      return;
    }
    setSheetsUrl(trimmed);
    onSheetsUrlSave(trimmed);
    setSheetSaved(true);
    addToast('Google Sheets connected — loading data');
  };

  const handleTestConnection = async () => {
    const trimmed = sheetInput.trim();
    if (!trimmed) return;
    setTesting(true);
    try {
      const data = await loadFromSheets(trimmed);
      addToast(`Connected — ${data.initiatives.length} initiatives, ${data.activities.length} activities in Sheets`);
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
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
        <p className="text-sm text-gray-500 mt-0.5">Manage Google Sheets backend and data</p>
      </div>

      {/* Google Sheets */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Table size={16} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-gray-200">Google Sheets Backend</h2>
          {sheetSaved && sheetsUrl ? (
            <span className="badge badge-active ml-auto flex items-center gap-1">
              Connected
            </span>
          ) : (
            <span className="badge badge-paused ml-auto">Not connected</span>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Connect a Google Sheet to store all data in the cloud. Google Sheets is the <strong className="text-gray-400">primary backend</strong> — all reads and writes go to Sheets first, with localStorage as a fallback.
        </p>

        {/* Setup Instructions */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 space-y-3">
          <p className="text-xs font-medium text-gray-300">Setup (one-time)</p>
          <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
            <li>Open <span className="text-gray-200">Google Sheets</span> and create a new spreadsheet</li>
            <li>Click <span className="text-gray-200">Extensions → Apps Script</span></li>
            <li>Delete any existing code and paste the script below</li>
            <li>Click <span className="text-gray-200">Deploy → New deployment → Web app</span></li>
            <li>Set <span className="text-gray-200">Execute as: Me</span> and <span className="text-gray-200">Who has access: Anyone</span></li>
            <li>Copy the Web App URL and paste it below</li>
          </ol>

          <div className="relative">
            <pre className="text-xs text-gray-400 bg-gray-900 rounded p-3 overflow-x-auto max-h-40 font-mono leading-relaxed whitespace-pre">
              {APPS_SCRIPT_CODE}
            </pre>
            <button
              onClick={handleCopyCode}
              className="absolute top-2 right-2 btn-secondary text-xs flex items-center gap-1 px-2 py-1"
            >
              {codeCopied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
            </button>
          </div>

          <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              <strong>Important:</strong> If you previously deployed an older version, you must create a <strong>new deployment</strong> after pasting the updated script. Updating an existing deployment won't apply the new code.
            </p>
          </div>
        </div>

        <div>
          <label className="label">Web App URL</label>
          <input
            value={sheetInput}
            onChange={(e) => { setSheetInput(e.target.value); setSheetSaved(false); }}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="input font-mono text-xs"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={handleSaveSheetsUrl} className="btn-primary flex items-center gap-1.5">
            <CheckCircle size={14} />
            {sheetInput.trim() ? 'Save & Connect' : 'Disconnect'}
          </button>
          {sheetInput.trim() && (
            <button onClick={handleTestConnection} disabled={testing} className="btn-secondary flex items-center gap-1.5 disabled:opacity-50">
              {testing ? <Loader size={13} className="animate-spin" /> : <Table size={13} />}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          )}
          {sheetsConnected && (
            <button onClick={handleSync} disabled={syncing} className="btn-secondary flex items-center gap-1.5 disabled:opacity-50">
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>

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
            <p className="text-xs text-gray-500 mt-0.5">Permanently delete all initiatives and activities{sheetsConnected ? ' (from Sheets and local cache)' : ''}</p>
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
        <p className="text-xs text-gray-600">Google Sheets backend · localStorage fallback</p>
      </div>
    </div>
  );
}
