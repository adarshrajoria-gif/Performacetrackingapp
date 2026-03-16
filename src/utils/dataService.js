// ─── Data Service ─────────────────────────────────────────────────────────────
// Sheets-first, localStorage-cache abstraction layer.
// All methods are async. When Sheets is configured, it's the source of truth.
// localStorage is updated as a cache after every successful Sheets operation.
// If Sheets is unavailable, operations fall back to localStorage.

import {
    getInitiatives, setInitiatives,
    getActivities, setActivities,
    getSheetsUrl,
} from './storage';

import {
    loadFromSheets,
    sheetsAddInitiative, sheetsUpdateInitiative, sheetsDeleteInitiative,
    sheetsAddActivity, sheetsAddActivities, sheetsUpdateActivity, sheetsDeleteActivity,
    sheetsClearAll, saveToSheets,
} from './sheetsApi';

import { normalizeDate, normalizeActivity } from './helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function url() {
    return getSheetsUrl();
}

function isConnected() {
    return !!url();
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadData() {
    let initiatives = [];
    let activities = [];
    const sheetsUrl = url();

    if (sheetsUrl) {
        try {
            const data = await loadFromSheets(sheetsUrl);
            initiatives = data.initiatives.map(i => ({
                ...i,
                createdAt: normalizeDate(i.createdAt),
            }));
            activities = data.activities.map(a => normalizeActivity({
                ...a,
                date: normalizeDate(a.date),
            }, initiatives));
        } catch (err) {
            console.warn('Sheets load failed, using local cache:', err.message);
            initiatives = getInitiatives();
            activities = getActivities();
        }
    } else {
        initiatives = getInitiatives();
        activities = getActivities();
    }

    // Sync cache locally if we got data (even if empty)
    if (sheetsUrl) {
        setInitiatives(initiatives);
        setActivities(activities);
    }

    return { initiatives, activities };
}

// ─── Initiative CRUD ──────────────────────────────────────────────────────────

export async function addInitiative(initiative) {
    const sheetsUrl = url();
    if (sheetsUrl) {
        try {
            await sheetsAddInitiative(sheetsUrl, initiative);
            // Update local cache
            const list = getInitiatives();
            list.push(initiative);
            setInitiatives(list);
            return;
        } catch (err) {
            console.warn('Sheets addInitiative failed, saving locally:', err.message);
        }
    }
    const list = getInitiatives();
    list.push(initiative);
    setInitiatives(list);
}

export async function updateInitiative(id, updates) {
    const sheetsUrl = url();
    if (sheetsUrl) {
        try {
            await sheetsUpdateInitiative(sheetsUrl, id, updates);
            const list = getInitiatives().map((i) => (i.id === id ? { ...i, ...updates } : i));
            setInitiatives(list);
            return;
        } catch (err) {
            console.warn('Sheets updateInitiative failed, saving locally:', err.message);
        }
    }
    const list = getInitiatives().map((i) => (i.id === id ? { ...i, ...updates } : i));
    setInitiatives(list);
}

export async function deleteInitiative(id) {
    const sheetsUrl = url();
    if (sheetsUrl) {
        try {
            await sheetsDeleteInitiative(sheetsUrl, id);
            setInitiatives(getInitiatives().filter((i) => i.id !== id));
            setActivities(getActivities().filter((a) => a.initiativeId !== id));
            return;
        } catch (err) {
            console.warn('Sheets deleteInitiative failed, saving locally:', err.message);
        }
    }
    setInitiatives(getInitiatives().filter((i) => i.id !== id));
    setActivities(getActivities().filter((a) => a.initiativeId !== id));
}

// ─── Activity CRUD ────────────────────────────────────────────────────────────

export async function addActivity(activity) {
    const sheetsUrl = url();
    if (sheetsUrl) {
        try {
            const initList = getInitiatives();
            const normalized = normalizeActivity(activity, initList);
            await sheetsAddActivity(sheetsUrl, normalized);
            const actList = getActivities();
            actList.push(normalized);
            setActivities(actList);
            return;
        } catch (err) {
            console.warn('Sheets addActivity failed, saving locally:', err.message);
        }
    }
    const list = getActivities();
    list.push(activity);
    setActivities(list);
}

export async function addActivities(activities) {
    const sheetsUrl = url();
    if (sheetsUrl) {
        try {
            await sheetsAddActivities(sheetsUrl, activities);
            const current = getActivities();
            setActivities([...current, ...activities]);
            return;
        } catch (err) {
            console.warn('Sheets addActivities failed, saving locally:', err.message);
        }
    }
    const current = getActivities();
    setActivities([...current, ...activities]);
}

export async function updateActivity(id, updates) {
    const sheetsUrl = url();
    if (sheetsUrl) {
        try {
            await sheetsUpdateActivity(sheetsUrl, id, updates);
            const inits = getInitiatives();
            const list = getActivities().map((a) => (a.id === id ? normalizeActivity({ ...a, ...updates }, inits) : a));
            setActivities(list);
            return;
        } catch (err) {
            console.warn('Sheets updateActivity failed, saving locally:', err.message);
        }
    }
    const list = getActivities().map((a) => (a.id === id ? { ...a, ...updates } : a));
    setActivities(list);
}

export async function deleteActivity(id) {
    const sheetsUrl = url();
    if (sheetsUrl) {
        try {
            await sheetsDeleteActivity(sheetsUrl, id);
            setActivities(getActivities().filter((a) => a.id !== id));
            return;
        } catch (err) {
            console.warn('Sheets deleteActivity failed, saving locally:', err.message);
        }
    }
    setActivities(getActivities().filter((a) => a.id !== id));
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export async function clearAllData() {
    const sheetsUrl = url();
    if (sheetsUrl) {
        try {
            await sheetsClearAll(sheetsUrl);
        } catch (err) {
            console.warn('Sheets clearAll failed:', err.message);
        }
    }
    setInitiatives([]);
    setActivities([]);
}

export async function importData(initiatives, activities) {
    const sheetsUrl = url();
    if (sheetsUrl) {
        try {
            await saveToSheets(sheetsUrl, initiatives, activities);
        } catch (err) {
            console.warn('Sheets import failed, saving locally:', err.message);
        }
    }
    setInitiatives(initiatives);
    setActivities(activities);
}

export { isConnected };
