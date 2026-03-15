import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />,
  error: <XCircle size={16} className="text-red-400 flex-shrink-0" />,
  warning: <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />,
  info: <AlertCircle size={16} className="text-cyan-400 flex-shrink-0" />,
};

const bg = {
  success: 'bg-gray-900 border-emerald-500/30',
  error: 'bg-gray-900 border-red-500/30',
  warning: 'bg-gray-900 border-amber-500/30',
  info: 'bg-gray-900 border-cyan-500/30',
};

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl ${bg[t.type] || bg.info} animate-in slide-in-from-right-4`}
        >
          {icons[t.type] || icons.info}
          <span className="text-sm text-gray-200 flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="text-gray-500 hover:text-gray-300 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
