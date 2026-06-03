const BASE = import.meta.env.BASE_URL

// 唯一的提醒音效
const SOUND_FILE = `${BASE}sounds/mixkit-tick-tock-clock-timer-1045.wav`

// 正式提醒持續時間（毫秒），預覽則短播
export const ALARM_DURATION_MS = 5000
const PREVIEW_DURATION_MS = 2000

let ctx = null
let buffer = null
let bufferPromise = null
let currentSource = null

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  return ctx
}

async function resumedCtx() {
  const c = getCtx()
  if (!c) return null
  if (c.state === 'suspended') {
    try { await c.resume() } catch {}
  }
  return c
}

// 解碼音檔成 AudioBuffer（只做一次）
function loadBuffer() {
  if (buffer) return Promise.resolve(buffer)
  if (bufferPromise) return bufferPromise
  const c = getCtx()
  if (!c) return Promise.resolve(null)
  bufferPromise = fetch(SOUND_FILE)
    .then((r) => r.arrayBuffer())
    .then((ab) => c.decodeAudioData(ab))
    .then((buf) => { buffer = buf; return buf })
    .catch((e) => { console.warn('Audio decode failed:', e); bufferPromise = null; return null })
  return bufferPromise
}

// 在使用者手勢時呼叫：解鎖 context 並預先載入音檔
export function unlockAudio() {
  resumedCtx()
  loadBuffer()
}

// 合成嗶聲備援（無法解碼音檔時使用）
async function playBeepSynth(durationMs = ALARM_DURATION_MS) {
  try {
    const c = await resumedCtx()
    if (!c) return

    const beepDuration = 0.15
    const beepGap = 0.30
    const beepCount = Math.max(3, Math.round((durationMs / 1000) / beepGap))

    for (let i = 0; i < beepCount; i++) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = 'square'
      osc.frequency.value = 1100
      const t = c.currentTime + i * beepGap
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.55, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + beepDuration)
      osc.start(t)
      osc.stop(t + beepDuration)
    }
  } catch (e) {
    console.warn('Synth playback failed:', e)
  }
}

function stopCurrent() {
  if (currentSource) {
    try { currentSource.stop() } catch {}
    currentSource = null
  }
}

// 透過已解鎖的 context 播放 buffer，循環撐滿 sustainMs 後停止
async function playBuffer(sustainMs) {
  const c = await resumedCtx()
  if (!c) { playBeepSynth(sustainMs); return }
  const buf = await loadBuffer()
  if (!buf) { playBeepSynth(sustainMs); return }

  stopCurrent()
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  src.connect(c.destination)
  currentSource = src
  try { src.start() } catch (e) { console.warn(e); playBeepSynth(sustainMs); return }

  setTimeout(() => {
    if (currentSource === src) {
      try { src.stop() } catch {}
      currentSource = null
    }
  }, sustainMs)
}

// 正式提醒：持續約 5 秒
export function playSound() {
  playBuffer(ALARM_DURATION_MS)
}

// 試聽：短播一次
export function previewSound() {
  playBuffer(PREVIEW_DURATION_MS)
}
