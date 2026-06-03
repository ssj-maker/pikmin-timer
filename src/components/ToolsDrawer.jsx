import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Typography, Box, Switch,
} from '@mui/material'
import SyncIcon from '@mui/icons-material/Sync'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import NotificationsIcon from '@mui/icons-material/Notifications'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { serializeState, clearOldKeys } from '../utils/storageUtils'
import { unlockAudio, previewSound } from '../utils/audioUtils'

export default function ToolsDrawer({
  open, onClose,
  onOpenSync,
  state, dispatch,
  notifySupported, notifyStatus, onNotifyToggle,
  onImportClick,
}) {
  function handleExport() {
    const data = serializeState(state)
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pikmin-timer-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onClose()
  }

  function handleClearAll() {
    if (!window.confirm('確定要清空所有場景、地點與倒數資料嗎？')) return
    dispatch({ type: 'CLEAR_ALL' })
    clearOldKeys()
    onClose()
  }

  const isGranted = notifyStatus === 'granted'
  const isDenied = notifyStatus === 'denied'
  const soundOn = !!state.soundEnabled
  const notifyOn = isGranted && !!state.notifyEnabled

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 260, pt: 1 } }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={900} color="primary.dark">🍄 工具</Typography>
      </Box>
      <List>
        {/* 提醒設定：音效與系統通知是兩個獨立的管道 */}
        <Typography variant="overline" color="text.secondary" sx={{ px: 2, fontWeight: 900 }}>
          提醒
        </Typography>
        <ListItem
          secondaryAction={
            <Switch
              checked={soundOn}
              onChange={(e) => {
                const on = e.target.checked
                if (on) { unlockAudio(); previewSound() }
                dispatch({ type: 'SET_SETTINGS', payload: { soundEnabled: on } })
              }}
              size="small"
              color="primary"
            />
          }
        >
          <ListItemIcon>
            <VolumeUpIcon color={soundOn ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText
            primary="提示音效"
            secondary={soundOn ? '重生前會播放音效' : '此裝置所有瀏覽器皆可用'}
          />
        </ListItem>
        {notifySupported && (
          <ListItem
            secondaryAction={
              <Switch
                checked={notifyOn}
                onChange={(e) => onNotifyToggle?.(e.target.checked)}
                size="small"
                color="primary"
              />
            }
          >
            <ListItemIcon>
              <NotificationsIcon color={notifyOn ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary="系統通知"
              secondary={
                isDenied ? '已被瀏覽器封鎖，請至網站設定開啟' :
                notifyOn ? '切到其他分頁也會跳出通知' :
                isGranted ? '已授權，點開即可恢復' :
                '切到其他分頁也能收到提醒'
              }
            />
          </ListItem>
        )}
        <Divider />
        <ListItemButton onClick={() => { onOpenSync(); onClose() }}>
          <ListItemIcon><SyncIcon color="primary" /></ListItemIcon>
          <ListItemText primary="跨裝置同步" secondary="同步碼 / 分享連結" />
        </ListItemButton>
        <Divider />
        <ListItemButton onClick={handleExport}>
          <ListItemIcon><FileDownloadIcon /></ListItemIcon>
          <ListItemText primary="匯出檔案" secondary="下載 JSON 備份" />
        </ListItemButton>
        <ListItemButton onClick={() => { onImportClick(); onClose() }}>
          <ListItemIcon><FileUploadIcon /></ListItemIcon>
          <ListItemText primary="匯入檔案" secondary="從 JSON 還原資料" />
        </ListItemButton>
        <Divider />
        <ListItemButton onClick={handleClearAll}>
          <ListItemIcon><DeleteForeverIcon color="error" /></ListItemIcon>
          <ListItemText primary="清空所有資料" primaryTypographyProps={{ color: 'error' }} />
        </ListItemButton>
      </List>
    </Drawer>
  )
}
