// localStorage keys
const KEYS = {
  INITIATIVES: 'it_initiatives',
  ACTIVITIES: 'it_activities',
  API_KEY: 'it_api_key',
  SEEDED: 'it_seeded',
};

export const storage = {
  get: (key) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('localStorage write failed', e);
    }
  },
  remove: (key) => localStorage.removeItem(key),
};

// Initiatives
export const getInitiatives = () => storage.get(KEYS.INITIATIVES) || [];
export const setInitiatives = (data) => storage.set(KEYS.INITIATIVES, data);

export const addInitiative = (initiative) => {
  const list = getInitiatives();
  list.push(initiative);
  setInitiatives(list);
};

export const updateInitiative = (id, updates) => {
  const list = getInitiatives().map((i) => (i.id === id ? { ...i, ...updates } : i));
  setInitiatives(list);
};

export const deleteInitiative = (id) => {
  setInitiatives(getInitiatives().filter((i) => i.id !== id));
  setActivities(getActivities().filter((a) => a.initiativeId !== id));
};

// Activities
export const getActivities = () => storage.get(KEYS.ACTIVITIES) || [];
export const setActivities = (data) => storage.set(KEYS.ACTIVITIES, data);

export const addActivity = (activity) => {
  const list = getActivities();
  list.push(activity);
  setActivities(list);
};

export const addActivities = (activities) => {
  const list = getActivities();
  setActivities([...list, ...activities]);
};

export const updateActivity = (id, updates) => {
  const list = getActivities().map((a) => (a.id === id ? { ...a, ...updates } : a));
  setActivities(list);
};

export const deleteActivity = (id) => {
  setActivities(getActivities().filter((a) => a.id !== id));
};

// API Key
export const getApiKey = () => storage.get(KEYS.API_KEY);
export const setApiKey = (key) => storage.set(KEYS.API_KEY, key);
export const clearApiKey = () => storage.remove(KEYS.API_KEY);

// Seeded flag
export const isSeeded = () => !!storage.get(KEYS.SEEDED);
export const markSeeded = () => storage.set(KEYS.SEEDED, true);

// Export / Import
export const exportData = () => {
  return JSON.stringify({
    initiatives: getInitiatives(),
    activities: getActivities(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
};

export const importData = (jsonStr) => {
  const data = JSON.parse(jsonStr);
  if (data.initiatives) setInitiatives(data.initiatives);
  if (data.activities) setActivities(data.activities);
};
