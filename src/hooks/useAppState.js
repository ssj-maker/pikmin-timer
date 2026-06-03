import { useReducer, useEffect } from 'react'
import { cleanName, MAX_SCENES, RESPAWN_DELAY_MS } from '../utils/timeUtils'
import { saveState, loadState } from '../utils/storageUtils'

const DEFAULT_STATE = {
  scenes: [
    {
      id: 'scene_1',
      name: '預設場景',
      locations: [],
    },
  ],
  currentSceneId: 'scene_1',
  locationCounter: 1,
  sceneCounter: 2,
  warnSeconds: 45,
  soundEnabled: false,
  soundType: 'beep',
  notifyEnabled: true,
}

function createLocation(type, name, counter) {
  return {
    id: `loc_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
    type,
    name: cleanName(name || `${type} ${counter}`),
    inputTime: '',
    finishTime: null,
    respawnTime: null,
    direction: '',
    peopleCount: '',
    notifiedOneMinute: false,
  }
}

function getCurrentScene(state) {
  return state.scenes.find((s) => s.id === state.currentSceneId) ?? state.scenes[0]
}

function updateLocation(state, id, changes) {
  const scene = getCurrentScene(state)
  if (!scene) return state
  return {
    ...state,
    scenes: state.scenes.map((s) =>
      s.id === scene.id
        ? { ...s, locations: s.locations.map((l) => (l.id === id ? { ...l, ...changes } : l)) }
        : s
    ),
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload

    case 'ADD_LOCATION': {
      const { locType, name } = action.payload
      const scene = getCurrentScene(state)
      if (!scene) return state
      const newLoc = createLocation(locType, name, state.locationCounter)
      return {
        ...state,
        locationCounter: state.locationCounter + 1,
        scenes: state.scenes.map((s) =>
          s.id === scene.id ? { ...s, locations: [...s.locations, newLoc] } : s
        ),
      }
    }

    case 'DELETE_LOCATION': {
      const scene = getCurrentScene(state)
      if (!scene) return state
      return {
        ...state,
        scenes: state.scenes.map((s) =>
          s.id === scene.id
            ? { ...s, locations: s.locations.filter((l) => l.id !== action.payload.id) }
            : s
        ),
      }
    }

    case 'UPDATE_LOCATION':
      return updateLocation(state, action.payload.id, action.payload.changes)

    case 'START_TIMER': {
      const { id, seconds, inputLabel } = action.payload
      const now = Date.now()
      const finishTime = now + seconds * 1000
      const respawnTime = finishTime + RESPAWN_DELAY_MS
      return updateLocation(state, id, {
        inputTime: inputLabel,
        finishTime,
        respawnTime,
        notifiedOneMinute: false,
      })
    }

    case 'CLEAR_TIMER':
      return updateLocation(state, action.payload.id, {
        inputTime: '',
        finishTime: null,
        respawnTime: null,
        notifiedOneMinute: false,
      })

    case 'MARK_NOTIFIED':
      return updateLocation(state, action.payload.id, { notifiedOneMinute: true })

    case 'ADD_SCENE': {
      if (state.scenes.length >= MAX_SCENES) return state
      const newScene = {
        id: `scene_${state.sceneCounter}`,
        name: cleanName(action.payload.name),
        locations: [],
      }
      return {
        ...state,
        sceneCounter: state.sceneCounter + 1,
        scenes: [...state.scenes, newScene],
        currentSceneId: newScene.id,
      }
    }

    case 'DELETE_SCENE': {
      const { id } = action.payload
      if (id === 'scene_1') return state
      return {
        ...state,
        scenes: state.scenes.filter((s) => s.id !== id),
        currentSceneId: 'scene_1',
      }
    }

    case 'UPDATE_SCENE_NAME':
      return {
        ...state,
        scenes: state.scenes.map((s) =>
          s.id === action.payload.id ? { ...s, name: cleanName(action.payload.name) } : s
        ),
      }

    case 'SWITCH_SCENE':
      return { ...state, currentSceneId: action.payload.id }

    case 'SET_SETTINGS': {
      const next = { ...state, ...action.payload }
      // 提醒時間改變時，對「還沒到新門檻」的地點重置已提醒旗標，
      // 讓它能在新的提醒門檻再響一次。
      if (action.payload.warnSeconds !== undefined && action.payload.warnSeconds !== state.warnSeconds) {
        const newWarnMs = action.payload.warnSeconds * 1000
        const nowTs = Date.now()
        next.scenes = state.scenes.map((s) => ({
          ...s,
          locations: s.locations.map((l) =>
            l.respawnTime && l.notifiedOneMinute && (l.respawnTime - nowTs) > newWarnMs
              ? { ...l, notifiedOneMinute: false }
              : l
          ),
        }))
      }
      return next
    }

    case 'CLEAR_ALL':
      return {
        ...DEFAULT_STATE,
        scenes: [{ id: 'scene_1', name: '預設場景', locations: [] }],
      }

    default:
      return state
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, null, () => loadState() ?? DEFAULT_STATE)

  useEffect(() => {
    saveState(state)
  }, [state])

  return { state, dispatch, getCurrentScene: () => getCurrentScene(state) }
}
