
// Supabase-first, localStorage-cache abstraction layer.
// All methods are async. When Supabase is configured, it's the source of truth.
// localStorage is updated as a cache after every successful Supabase operation.
// If Supabase is unavailable, operations fall back to localStorage.

import {
 getInitiatives, setInitiatives,
 getActivities, setActivities,
 getSupabaseConfig,
} from './storage';

import { getSupabase } from './supabaseClient';
import { normalizeDate, normalizeActivity } from './helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isConnected() {
 const { url, key } = getSupabaseConfig();
 return !!(url && key);
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadData() {
 let initiatives = [];
 let activities = [];
 const supabase = getSupabase();

 if (supabase) {
 try {
 // Fetch initiatives with related data via join tables
 const { data: initData, error: initError } = await supabase
 .from('initiatives')
 .select(`
 *,
 platforms:initiative_platforms(platforms(name)),
 activityTypes:initiative_activity_types(activity_types(name)),
 funnelStages:initiative_funnel_stages(funnel_stages(name))
 `);

 if (initError) throw initError;

 initiatives = initData.map(i => ({
 id: i.id,
 name: i.name,
 description: i.description || '',
 status: i.status || 'active',
 createdAt: normalizeDate(i.createdAt),
 platforms: i.platforms?.map(p => p.platforms?.name).filter(Boolean) || [],
 activityTypes: i.activityTypes?.map(at => at.activity_types?.name).filter(Boolean) || [],
 funnelStages: i.funnelStages?.map(fs => fs.funnel_stages?.name).filter(Boolean) || []
 }));

 // Fetch activities with stage counts
 const { data: actData, error: actError } = await supabase
 .from('activities')
 .select(`
 *,
 counts:activity_stage_counts(count, funnel_stages(name))
 `);

 if (actError) throw actError;

 activities = actData.map(a => {
 // Map DB columns to frontend camelCase keys
 const activity = {
 id: a.id,
 initiativeId: a.initiative_id,
 date: normalizeDate(a.date),
 platform: a.platform || '',
 activityType: a.activity_type || '',
 title: a.title || '',
 notes: a.notes || '',
 stageCounts: {}
 };

 // Transform the array of count objects into a flat stageCounts object
 if (a.counts && Array.isArray(a.counts)) {
 a.counts.forEach(c => {
 const stageName = c.funnel_stages?.name;
 if (stageName) {
 activity.stageCounts[stageName] = c.count;
 }
 });
 }

 return normalizeActivity(activity);
 });
 } catch (err) {
 console.warn('Supabase load failed, using local cache:', err.message);
 initiatives = getInitiatives();
 activities = getActivities();
 }
 } else {
 initiatives = getInitiatives();
 activities = getActivities();
 }

 // Sync cache locally if we got data (even if empty)
 if (supabase) {
 setInitiatives(initiatives);
 setActivities(activities);
 }

 return { initiatives, activities };
}

// ─── Initiative CRUD ──────────────────────────────────────────────────────────

export async function addInitiative(initiative) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 const { error } = await supabase.from('initiatives').insert(initiative);
 if (error) throw error;
 // Update local cache
 const list = getInitiatives();
 list.push(initiative);
 setInitiatives(list);
 return;
 } catch (err) {
 console.warn('Supabase addInitiative failed, saving locally:', err.message);
 }
 }
 const list = getInitiatives();
 list.push(initiative);
 setInitiatives(list);
}

export async function updateInitiative(id, updates) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 const { error } = await supabase.from('initiatives').update(updates).eq('id', id);
 if (error) throw error;
 const list = getInitiatives().map((i) => (i.id === id ? { ...i, ...updates } : i));
 setInitiatives(list);
 return;
 } catch (err) {
 console.warn('Supabase updateInitiative failed, saving locally:', err.message);
 }
 }
 const list = getInitiatives().map((i) => (i.id === id ? { ...i, ...updates } : i));
 setInitiatives(list);
}

export async function deleteInitiative(id) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 const { error } = await supabase.from('initiatives').delete().eq('id', id);
 if (error) throw error;
 setInitiatives(getInitiatives().filter((i) => i.id !== id));
 setActivities(getActivities().filter((a) => a.initiativeId !== id));
 return;
 } catch (err) {
 console.warn('Supabase deleteInitiative failed, saving locally:', err.message);
 }
 }
 setInitiatives(getInitiatives().filter((i) => i.id !== id));
 setActivities(getActivities().filter((a) => a.initiativeId !== id));
}

// ─── Activity CRUD ────────────────────────────────────────────────────────────

export async function addActivity(activity) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 const initList = getInitiatives();
 const normalized = normalizeActivity(activity, initList);
 const { error } = await supabase.from('activities').insert(normalized);
 if (error) throw error;
 const actList = getActivities();
 actList.push(normalized);
 setActivities(actList);
 return;
 } catch (err) {
 console.warn('Supabase addActivity failed, saving locally:', err.message);
 }
 }
 const list = getActivities();
 list.push(activity);
 setActivities(list);
}

export async function addActivities(activities) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 const { error } = await supabase.from('activities').insert(activities);
 if (error) throw error;
 const current = getActivities();
 setActivities([...current, ...activities]);
 return;
 } catch (err) {
 console.warn('Supabase addActivities failed, saving locally:', err.message);
 }
 }
 const current = getActivities();
 setActivities([...current, ...activities]);
}

export async function updateActivity(id, updates) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 const { error } = await supabase.from('activities').update(updates).eq('id', id);
 if (error) throw error;
 const inits = getInitiatives();
 const list = getActivities().map((a) => (a.id === id ? normalizeActivity({ ...a, ...updates }, inits) : a));
 setActivities(list);
 return;
 } catch (err) {
 console.warn('Supabase updateActivity failed, saving locally:', err.message);
 }
 }
 const list = getActivities().map((a) => (a.id === id ? { ...a, ...updates } : a));
 setActivities(list);
}

export async function deleteActivity(id) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 const { error } = await supabase.from('activities').delete().eq('id', id);
 if (error) throw error;
 setActivities(getActivities().filter((a) => a.id !== id));
 return;
 } catch (err) {
 console.warn('Supabase deleteActivity failed, saving locally:', err.message);
 }
 }
 setActivities(getActivities().filter((a) => a.id !== id));
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export async function clearAllData() {
 const supabase = getSupabase();
 if (supabase) {
 try {
 await Promise.all([
 supabase.from('activities').delete().neq('id', 'temp'), // Delete all
 supabase.from('initiatives').delete().neq('id', 'temp')
 ]);
 } catch (err) {
 console.warn('Supabase clearAll failed:', err.message);
 }
 }
 setInitiatives([]);
 setActivities([]);
}

export async function importData(initiatives, activities) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 if (initiatives && initiatives.length > 0) {
 const { error: initError } = await supabase.from('initiatives').upsert(initiatives);
 if (initError) throw initError;
 }
 if (activities && activities.length > 0) {
 const { error: actError } = await supabase.from('activities').upsert(activities);
 if (actError) throw actError;
 }
 } catch (err) {
 console.warn('Supabase import failed, saving locally:', err.message);
 }
 }
 setInitiatives(initiatives);
 setActivities(activities);
}

export { isConnected };