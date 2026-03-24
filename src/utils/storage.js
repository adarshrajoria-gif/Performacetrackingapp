// localStorage keys
const KEYS = {
  INITIATIVES: 'it_initiatives',
  ACTIVITIES: 'it_activities',
  SUPABASE_URL: 'it_supabase_url',
  SUPABASE_KEY: 'it_supabase_key',
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


// Supabase Config
export const getSupabaseConfig = () => {
  // 1. Check localStorage (Manual override/settings)
  const localUrl = storage.get(KEYS.SUPABASE_URL);
  const localKey = storage.get(KEYS.SUPABASE_KEY);
  
  if (localUrl && localKey) {
    return { url: localUrl, key: localKey };
  }

  // 2. Fallback to Environment Variable
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }

  return { url: '', key: '' };
};

export const setSupabaseConfig = (url, key) => {
  storage.set(KEYS.SUPABASE_URL, url);
  storage.set(KEYS.SUPABASE_KEY, key);
};
export const clearSupabaseConfig = () => {
  storage.remove(KEYS.SUPABASE_URL);
  storage.remove(KEYS.SUPABASE_KEY);
};

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
