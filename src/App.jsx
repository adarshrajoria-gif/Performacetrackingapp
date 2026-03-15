import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/Toast';
import { ApiKeyModal } from './components/ApiKeyModal';
import Dashboard from './pages/Dashboard';
import Log from './pages/Log';
import Initiatives from './pages/Initiatives';
import Settings from './pages/Settings';
import {
  getInitiatives, getActivities, getApiKey,
  setInitiatives, setActivities, markSeeded, isSeeded,
} from './utils/storage';
import { seedInitiatives, seedActivities } from './utils/seedData';
import { useToast } from './hooks/useToast';

function App() {
  const [initiatives, setInitiativesState] = useState([]);
  const [activities, setActivitiesState] = useState([]);
  const [apiKey, setApiKeyState] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Load data from localStorage
  const loadData = useCallback(() => {
    setInitiativesState(getInitiatives());
    setActivitiesState(getActivities());
    setApiKeyState(getApiKey());
  }, []);

  useEffect(() => {
    // Seed on first run
    if (!isSeeded()) {
      setInitiatives(seedInitiatives);
      setActivities(seedActivities);
      markSeeded();
    }
    loadData();
  }, [loadData]);

  const handleDataChange = useCallback(() => {
    setInitiativesState(getInitiatives());
    setActivitiesState(getActivities());
  }, []);

  const handleApiKeySave = useCallback((key) => {
    setApiKeyState(key);
    addToast('API key saved — AI features enabled');
  }, [addToast]);

  const handleSetCurrentApiKey = useCallback((key) => {
    setApiKeyState(key);
  }, []);

  const sharedProps = {
    initiatives,
    activities,
    onDataChange: handleDataChange,
    apiKey,
    addToast,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout apiKey={apiKey} />}>
          <Route path="/" element={<Dashboard {...sharedProps} />} />
          <Route
            path="/log"
            element={
              <Log
                {...sharedProps}
                onNeedApiKey={() => setShowApiKeyModal(true)}
              />
            }
          />
          <Route path="/initiatives" element={<Initiatives {...sharedProps} />} />
          <Route
            path="/settings"
            element={
              <Settings
                {...sharedProps}
                setCurrentApiKey={handleSetCurrentApiKey}
              />
            }
          />
        </Route>
      </Routes>

      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onSave={handleApiKeySave}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </BrowserRouter>
  );
}

export default App;
