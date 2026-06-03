import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Box,
} from '@mui/material'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { unlockAudio } from '../utils/audioUtils'

function formatWarn(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m === 0) return `${sec} 秒`
  if (sec === 0) return `${m} 分鐘`
  return `${m} 分 ${sec} 秒`
}

export default function NotificationPermissionDialog({ open, onClose, onAllowed, warnSeconds = 60 }) {
  function handleAllow() {
    unlockAudio()
    Notification.requestPermission()
      .then((p) => { if (p === 'granted') onAllowed?.() })
      .finally(() => onClose())
  }

  function handleSkip() {
    onClose()
  }

  return (
    <Dialog open={open} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0.5 }}>
        <NotificationsActiveIcon color="primary" />
        開啟系統通知
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14, lineHeight: 1.8 }}>
          允許後，即使切換到其他分頁，菇菇快重生時也會跳出系統通知提醒你。
          <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 700, color: 'primary.dark', fontSize: 13 }}>
            將在重生前 {formatWarn(warnSeconds)} 提醒
          </Box>
          <Box component="span" sx={{ display: 'block', mt: 0.5, color: 'text.disabled', fontSize: 12 }}>
            接著瀏覽器會再跳出一次授權詢問，請點「允許」。提示音效不需要這項權限，可單獨開關。
          </Box>
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleSkip} sx={{ color: 'text.secondary' }}>
          稍後再說
        </Button>
        <Button variant="contained" onClick={handleAllow} sx={{ flex: 1 }}>
          允許系統通知
        </Button>
      </DialogActions>
    </Dialog>
  )
}
