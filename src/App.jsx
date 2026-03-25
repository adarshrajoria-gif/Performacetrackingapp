import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Log from './pages/Log';
import Initiatives from './pages/Initiatives';
import Settings from './pages/Settings';
import { loadData, isConnected } from './utils/dataService';
import { useToast } from './hooks/useToast';

function App() {
  const [initiatives, setInitiativesState] = useState([]);
  const [activities, setActivitiesState] = useState([]);
  const [hasSupabaseConfig, setHasSupabaseConfig] = useState(isConnected());
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  // Load data from Supabase (primary) or localStorage (fallback)
  const refreshData = useCallback(async (opts = {}) => {
    try {
      const data = await loadData();
      setInitiativesState(data.initiatives);
      setActivitiesState(data.activities);
      if (opts.silent !== true && opts.showSuccess) {
        addToast('Data synced from Supabase');
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      if (opts.silent !== true) {
        addToast('Failed to load data', 'error');
      }
    }
  }, [addToast]);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData({ silent: true }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSupabaseConfigSave = useCallback(() => {
    const connected = isConnected();
    setHasSupabaseConfig(connected);
    if (connected) {
      refreshData({ showSuccess: true });
    }
  }, [refreshData]);

  const sharedProps = {
    initiatives,
    activities,
    refreshData,
    addToast,
    supabaseConnected: hasSupabaseConfig,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading data{isConnected() ? ' from Supabase' : ''}…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout supabaseConnected={hasSupabaseConfig} />}>
          <Route path="/" element={<Dashboard {...sharedProps} />} />
          <Route path="/log" element={<Log {...sharedProps} />} />
          <Route path="/initiatives" element={<Initiatives {...sharedProps} />} />
          <Route
            path="/settings"
            element={
              <Settings
                {...sharedProps}
                onSupabaseConfigSave={handleSupabaseConfigSave}
              />
            }
          />
        </Route>
      </Routes>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </BrowserRouter>
  );
}

export default App;

