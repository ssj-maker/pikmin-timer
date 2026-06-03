import { useState, useEffect, useRef } from 'react'
import {
  AppBar, Toolbar, Typography, IconButton, Container, Box, Paper,
  Snackbar, Alert, Button,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useAppState } from './hooks/useAppState'
import { useTick } from './hooks/useTick'
import { playSound, unlockAudio } from './utils/audioUtils'
import { parseSyncCode, buildShareLink } from './utils/syncUtils'
import { hydrateState } from './utils/storageUtils'
import SceneTabs from './components/SceneTabs'
import ReminderBar from './components/ReminderBar'
import AddLocationForm from './components/AddLocationForm'
import LocationList from './components/LocationList'
import ToolsDrawer from './components/ToolsDrawer'
import SyncDialog from './components/SyncDialog'
import NotificationPermissionDialog from './components/NotificationPermissionDialog'

export default function App() {
  const { state, dispatch } = useAppState()
  const now = useTick()

  const [toolsOpen, setToolsOpen] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' })

  const importFileRef = useRef(null)

  const currentScene = state.scenes.find((s) => s.id === state.currentSceneId) ?? state.scenes[0]
  const locations = currentScene?.locations ?? []

  // Notification permission state
  const notifySupported = typeof window !== 'undefined' && 'Notification' in window
  const notifyStatus = notifySupported ? Notification.permission : 'denied'
  const warnMs = (state.warnSeconds ?? 60) * 1000

  // Warning notifications + sound
  useEffect(() => {
    locations.forEach((loc) => {
      if (loc.notifiedOneMinute) return
      if (!loc.respawnTime) return
      const diff = loc.respawnTime - now
      if (diff > 0 && diff <= warnMs) {
        if (notifySupported && notifyStatus === 'granted' && state.notifyEnabled) {
          try {
            new Notification('菇菇即將重生', {
              body: `${loc.name}｜${loc.type}｜預計重生：${new Date(loc.respawnTime).toLocaleTimeString()}`,
              tag: `pikmin-${loc.id}`,
              renotify: true,
            })
          } catch (e) {
            console.warn(e)
          }
          if (navigator.vibrate) navigator.vibrate([200, 80, 200])
        }
        if (state.soundEnabled) playSound()
        dispatch({ type: 'MARK_NOTIFIED', payload: { id: loc.id } })
      }
    })
  }, [now, locations, notifySupported, notifyStatus, warnMs, state.soundEnabled, state.notifyEnabled, dispatch])

  // Check URL sync hash on mount
  useEffect(() => {
    const hash = location.hash || ''
    if (!hash.startsWith('#sync=')) return
    const code = hash.slice('#sync='.length)
    if (history?.replaceState) history.replaceState(null, '', location.pathname)
    else location.hash = ''
    try {
      const hydrated = hydrateState(parseSyncCode(code))
      if (!hydrated) return
      if (!window.confirm('偵測到同步連結，匯入後會取代目前資料，確定嗎？')) return
      dispatch({ type: 'LOAD_STATE', payload: hydrated })
      showSnack('匯入完成')
    } catch {
      showSnack('同步連結格式不正確', 'error')
    }
  }, [])

  function showSnack(msg, severity = 'success') {
    setSnack({ open: true, msg, severity })
  }

  // System-notification toggle (independent from sound).
  // Permission is only requested when the user explicitly turns it on.
  function handleNotifyToggle(on) {
    if (!on) {
      dispatch({ type: 'SET_SETTINGS', payload: { notifyEnabled: false } })
      return
    }
    if (!notifySupported) { showSnack('這個瀏覽器不支援系統通知，音效提醒仍可正常使用', 'warning'); return }
    if (notifyStatus === 'denied') {
      showSnack('系統通知已被瀏覽器封鎖，請到瀏覽器的網站設定重新允許（音效不受影響）', 'warning')
      return
    }
    if (notifyStatus === 'granted') {
      dispatch({ type: 'SET_SETTINGS', payload: { notifyEnabled: true } })
      showSnack('系統通知已開啟')
      return
    }
    // permission === 'default' → show in-context primer, then native prompt
    setNotifyDialogOpen(true)
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const hydrated = hydrateState(data)
        if (!hydrated) { showSnack('匯入檔案格式不正確', 'error'); return }
        if (!window.confirm('匯入後會取代目前資料，確定要匯入嗎？')) return
        dispatch({ type: 'LOAD_STATE', payload: hydrated })
        showSnack('匯入完成')
      } catch {
        showSnack('匯入失敗，請確認是否為正確 JSON 檔', 'error')
      }
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Button
            onClick={() => { unlockAudio(); setToolsOpen(true) }}
            startIcon={<SettingsIcon />}
            size="small"
            sx={{ color: 'text.secondary', fontWeight: 700 }}
          >
            設定
          </Button>
          <Box sx={{ flex: 1 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 2, px: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, flex: 1 }}>
            輸入地點名稱並選擇分類；系統會計算「打完時間＋5分鐘」並依最快重生排序
          </Typography>
          <ReminderBar
            warnSeconds={state.warnSeconds}
            soundEnabled={state.soundEnabled}
            dispatch={dispatch}
          />
        </Box>

        <Paper elevation={0} variant="outlined" sx={{ p: 1.5, mb: 2 }}>
          <SceneTabs scenes={state.scenes} currentSceneId={state.currentSceneId} dispatch={dispatch} />
        </Paper>

        <Paper elevation={0} variant="outlined" sx={{ p: 1.5, mb: 2 }}>
          <AddLocationForm dispatch={dispatch} />
        </Paper>

        <LocationList locations={locations} dispatch={dispatch} now={now} warnMs={warnMs} />
      </Container>

      <ToolsDrawer
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        onOpenSync={() => setSyncOpen(true)}
        state={state}
        dispatch={dispatch}
        notifySupported={notifySupported}
        notifyStatus={notifyStatus}
        onNotifyToggle={handleNotifyToggle}
        onImportClick={() => importFileRef.current?.click()}
      />

      <SyncDialog open={syncOpen} onClose={() => setSyncOpen(false)} state={state} dispatch={dispatch} />
      <NotificationPermissionDialog
        open={notifyDialogOpen}
        onClose={() => setNotifyDialogOpen(false)}
        onAllowed={() => { dispatch({ type: 'SET_SETTINGS', payload: { notifyEnabled: true } }); showSnack('系統通知已開啟') }}
        warnSeconds={state.warnSeconds}
      />

      <input ref={importFileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={handleImportFile} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
