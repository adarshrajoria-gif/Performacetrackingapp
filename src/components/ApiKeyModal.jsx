import { useState } from 'react';
import { Key, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { setApiKey } from '../utils/storage';

export function ApiKeyModal({ onClose, onSave }) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      alert('Key should start with sk-ant-');
      return;
    }
    setApiKey(trimmed);
    onSave(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-gray-100">Anthropic API Key</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-400">
          Enter your Anthropic API key to enable AI-powered text parsing. Your key is stored only in your browser's localStorage and never sent to any server other than Anthropic.
        </p>

        <div>
          <label className="label">API Key</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
              className="input pr-10 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <a
          href="https://console.anthropic.com/account/keys"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"
        >
          <ExternalLink size={12} />
          Get your API key from Anthropic Console
        </a>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
