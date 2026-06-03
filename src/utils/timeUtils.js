export const MAX_NAME_LENGTH = 8
export const MAX_SCENES = 3
export const RESPAWN_DELAY_MS = 5 * 60 * 1000

export function cleanName(value) {
  return String(value || '').trim().slice(0, MAX_NAME_LENGTH)
}

function isWholeNumber(value) {
  return typeof value === 'number' && isFinite(value) && Math.floor(value) === value
}

export function parseTime(value) {
  const text = String(value || '').trim()
  if (!text) return null
  let hours, minutes, seconds
  if (text.includes(':')) {
    const parts = text.split(':')
    if (parts.length === 3) {
      ;[hours, minutes, seconds] = parts.map(Number)
    } else if (parts.length === 2) {
      hours = 0;
      [minutes, seconds] = parts.map(Number)
    } else {
      return null
    }
  } else {
    if (!/^\d+$/.test(text)) return null
    hours = 0
    if (text.length <= 2) {
      minutes = 0
      seconds = Number(text)
    } else {
      seconds = Number(text.slice(-2))
      minutes = Number(text.slice(0, -2))
    }
  }
  if (!isWholeNumber(hours) || !isWholeNumber(minutes) || !isWholeNumber(seconds)) return null
  if (hours < 0 || minutes < 0 || seconds < 0 || minutes >= 60 || seconds >= 60) return null
  return hours * 3600 + minutes * 60 + seconds
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

export function normalizeTimeLabel(value) {
  const total = parseTime(value)
  if (total === null) return ''
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`
  return `${m}:${pad2(s)}`
}

export function formatClock(date) {
  if (!date) return '尚未設定'
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}時 ${pad2(m)}分 ${pad2(s)}秒`
  return `${m}分 ${pad2(s)}秒`
}

export function getTimerStatus(location, now = Date.now()) {
  if (!location.respawnTime) return 2
  if (location.respawnTime <= now) return 1
  return 0
}

export function getSortValue(location, now = Date.now()) {
  if (!location.respawnTime) return Number.MAX_SAFE_INTEGER
  return Math.max(0, location.respawnTime - now)
}

export function sortLocationList(list, now = Date.now()) {
  return [...list].sort((a, b) => {
    const sa = getTimerStatus(a, now)
    const sb = getTimerStatus(b, now)
    if (sa !== sb) return sa - sb
    if (sa === 0) return getSortValue(a, now) - getSortValue(b, now)
    return a.name.localeCompare(b.name, 'zh-Hant')
  })
}

export const DIRECTION_BUTTONS = [
  { value: '左上', label: '↖' }, { value: '上', label: '↑' }, { value: '右上', label: '↗' },
  { value: '左', label: '←' }, { value: '', label: '·' }, { value: '右', label: '→' },
  { value: '左下', label: '↙' }, { value: '下', label: '↓' }, { value: '右下', label: '↘' },
]

export const DIRECTION_ARROW = {
  '上': '↑', '下': '↓', '左': '←', '右': '→',
  '右上': '↗', '左上': '↖', '右下': '↘', '左下': '↙',
}
