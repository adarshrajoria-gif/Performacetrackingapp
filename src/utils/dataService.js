// ─── Data Service ─────────────────────────────────────────────────────────────
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
 // 1. Fetch initiatives with their relational data
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

 // 2. Fetch activities with their stage counts
 const { data: actData, error: actError } = await supabase
 .from('activities')
 .select(`
 *,
 counts:activity_stage_counts(count, funnel_stages(name))
 `);

 if (actError) throw actError;

 activities = actData.map(a => {
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

 if (supabase) {
 setInitiatives(initiatives);
 setActivities(activities);
 }

 return { initiatives, activities };
}

// ─── Initiative CRUD ──────────────────────────────────────────────────────────

// Helper to sync many-to-many relations for an initiative
async function syncInitiativeRelations(supabase, initiativeId, { platforms, activityTypes, funnelStages }) {
 // 1. Sync Platforms
 if (platforms) {
 // Ensure all platform names exist in the platforms lookup table
 const { data: pItems } = await supabase.from('platforms').upsert(platforms.map(name => ({ name })), { onConflict: 'name' }).select();
 // Clear old relations and insert new ones
 await supabase.from('initiative_platforms').delete().eq('initiative_id', initiativeId);
 if (pItems?.length) {
 await supabase.from('initiative_platforms').insert(pItems.map(p => ({ initiative_id: initiativeId, platform_id: p.id })));
 }
 }

 // 2. Sync Activity Types
 if (activityTypes) {
 const { data: atItems } = await supabase.from('activity_types').upsert(activityTypes.map(name => ({ name })), { onConflict: 'name' }).select();
 await supabase.from('initiative_activity_types').delete().eq('initiative_id', initiativeId);
 if (atItems?.length) {
 await supabase.from('initiative_activity_types').insert(atItems.map(at => ({ initiative_id: initiativeId, activity_type_id: at.id })));
 }
 }

 // 3. Sync Funnel Stages
 if (funnelStages) {
 const { data: fsItems } = await supabase.from('funnel_stages').upsert(funnelStages.map(name => ({ name })), { onConflict: 'name' }).select();
 await supabase.from('initiative_funnel_stages').delete().eq('initiative_id', initiativeId);
 if (fsItems?.length) {
 await supabase.from('initiative_funnel_stages').insert(fsItems.map(fs => ({ initiative_id: initiativeId, funnel_stage_id: fs.id })));
 }
 }
}

export async function addInitiative(initiative) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 // Separate relational arrays from core table fields
 const { platforms, activityTypes, funnelStages, ...coreFields } = initiative;
 const { error } = await supabase.from('initiatives').insert(coreFields);
 if (error) throw error;

 // Sync the many-to-many mappings
 await syncInitiativeRelations(supabase, initiative.id, { platforms, activityTypes, funnelStages });

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
 const { platforms, activityTypes, funnelStages, ...coreFields } = updates;
 // Update core fields if any
 if (Object.keys(coreFields).length > 0) {
 const { error } = await supabase.from('initiatives').update(coreFields).eq('id', id);
 if (error) throw error;
 }

 // Sync relations if any were provided
 if (platforms || activityTypes || funnelStages) {
 await syncInitiativeRelations(supabase, id, { platforms, activityTypes, funnelStages });
 }

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

// Helper to sync stage counts for an activity
async function syncActivityCounts(supabase, activityId, stageCounts) {
 if (!stageCounts || typeof stageCounts !== 'object') return;

 const stageNames = Object.keys(stageCounts);
 if (!stageNames.length) return;

 // 1. Ensure all stage names exist in lookup and get their IDs
 const { data: fsItems } = await supabase.from('funnel_stages').upsert(stageNames.map(name => ({ name })), { onConflict: 'name' }).select();

 if (fsItems) {
 const countRows = fsItems.map(fs => ({
 activity_id: activityId,
 funnel_stage_id: fs.id,
 count: stageCounts[fs.name] || 0
 }));

 // 2. Clear old counts and insert new ones
 await supabase.from('activity_stage_counts').delete().eq('activity_id', activityId);
 await supabase.from('activity_stage_counts').insert(countRows);
 }
}

export async function addActivity(activity) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 const initList = getInitiatives();
 const { stageCounts, initiativeId, activityType, ...core } = normalizeActivity(activity, initList);

 // Map to snake_case for DB
 const dbActivity = {
 ...core,
 initiative_id: initiativeId,
 activity_type: activityType
 };

 const { error } = await supabase.from('activities').insert(dbActivity);
 if (error) throw error;

 // Sync the relational stage counts
 await syncActivityCounts(supabase, activity.id, stageCounts);

 const actList = getActivities();
 actList.push(activity);
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
 // For simplicity, we loop through addActivity for bulk inserts to ensure counts are synced
 // In a production app, this should be optimized into a single batch
 for (const act of activities) {
 await addActivity(act);
 }
 return;
 }
 const current = getActivities();
 setActivities([...current, ...activities]);
}

export async function updateActivity(id, updates) {
 const supabase = getSupabase();
 if (supabase) {
 try {
 const { stageCounts, initiativeId, activityType, ...core } = updates;

 const dbUpdates = { ...core };
 if (initiativeId) dbUpdates.initiative_id = initiativeId;
 if (activityType) dbUpdates.activity_type = activityType;

 if (Object.keys(dbUpdates).length > 0) {
 const { error } = await supabase.from('activities').update(dbUpdates).eq('id', id);
 if (error) throw error;
 }

 if (stageCounts) {
 await syncActivityCounts(supabase, id, stageCounts);
 }

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