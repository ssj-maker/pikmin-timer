import { cleanName, MAX_SCENES } from './timeUtils'

const STORAGE_KEY = 'pikmin_mushroom_timer_v5'
const OLD_KEYS = [
  'pikmin_mushroom_timer_v4',
  'pikmin_mushroom_timer_v3',
  'pikmin_mushroom_timer_v2',
  'pikmin_mushroom_timer_v1',
]

function safeStorage() {
  try {
    localStorage.setItem('__test__', '1')
    localStorage.removeItem('__test__')
    return true
  } catch {
    return false
  }
}

function serializeLocations(locations) {
  return locations.map((loc) => ({
    id: loc.id,
    type: loc.type,
    name: loc.name,
    inputTime: loc.inputTime,
    finishTime: loc.finishTime ?? null,
    respawnTime: loc.respawnTime ?? null,
    direction: loc.direction || '',
    peopleCount: loc.peopleCount || '',
    notifiedOneMinute: !!loc.notifiedOneMinute,
  }))
}

function hydrateLocations(raw) {
  if (!raw?.length) return []
  return raw.map((item, i) => ({
    id: item.id || `loc_${Date.now()}_${i}`,
    type: item.type === '關精準位置' ? '關精準位置' : '正常位置',
    name: cleanName(item.name || '未命名'),
    inputTime: item.inputTime || '',
    finishTime: item.finishTime ? item.finishTime : null,
    respawnTime: item.respawnTime ? item.respawnTime : null,
    direction: item.direction || '',
    peopleCount: item.peopleCount || '',
    notifiedOneMinute: !!item.notifiedOneMinute,
  }))
}

export function serializeState(state) {
  return {
    version: 5,
    exportedAt: new Date().toISOString(),
    locationCounter: state.locationCounter,
    sceneCounter: state.sceneCounter,
    currentSceneId: state.currentSceneId,
    warnSeconds: state.warnSeconds ?? 60,
    soundEnabled: state.soundEnabled ?? true,
    soundType: state.soundType ?? 'beep',
    notifyEnabled: state.notifyEnabled ?? true,
    scenes: state.scenes.map((s) => ({
      id: s.id,
      name: s.name,
      locations: serializeLocations(s.locations),
    })),
  }
}

export function hydrateState(data) {
  if (data?.scenes?.length) {
    const scenes = data.scenes.slice(0, MAX_SCENES).map((s, i) => ({
      id: i === 0 ? 'scene_1' : (s.id || `scene_${i + 1}`),
      name: cleanName(s.name || (i === 0 ? '預設場景' : `場景${i + 1}`)),
      locations: hydrateLocations(s.locations || []),
    }))
    if (!scenes.length) return null
    scenes[0].id = 'scene_1'
    const sceneIds = new Set(scenes.map((s) => s.id))
    return {
      scenes,
      currentSceneId: sceneIds.has(data.currentSceneId) ? data.currentSceneId : scenes[0].id,
      locationCounter: data.locationCounter || 1,
      sceneCounter: Math.max(data.sceneCounter || 2, scenes.length + 1),
      warnSeconds: data.warnSeconds ?? (data.warnMinutes ? data.warnMinutes * 60 : 45),
      soundEnabled: data.soundEnabled ?? false,
      soundType: data.soundType ?? 'beep',
      notifyEnabled: data.notifyEnabled ?? true,
    }
  }
  if (data?.locations) {
    const locations = hydrateLocations(data.locations)
    return {
      scenes: [{ id: 'scene_1', name: '預設場景', locations }],
      currentSceneId: 'scene_1',
      locationCounter: data.locationCounter || locations.length + 1,
      sceneCounter: 2,
      warnSeconds: data.warnSeconds ?? 45,
      soundEnabled: data.soundEnabled ?? false,
      soundType: data.soundType ?? 'beep',
      notifyEnabled: data.notifyEnabled ?? true,
    }
  }
  return null
}

export function saveState(state) {
  if (!safeStorage()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state)))
  } catch (e) {
    console.warn(e)
  }
}

export function loadState() {
  if (!safeStorage()) return null
  try {
    let text = localStorage.getItem(STORAGE_KEY)
    if (!text) {
      for (const key of OLD_KEYS) {
        text = localStorage.getItem(key)
        if (text) break
      }
    }
    if (!text) return null
    return hydrateState(JSON.parse(text))
  } catch (e) {
    console.warn(e)
    return null
  }
}

export function clearOldKeys() {
  OLD_KEYS.forEach((k) => localStorage.removeItem(k))
}
