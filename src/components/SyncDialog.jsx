import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Divider, Snackbar, Alert,
} from '@mui/material'
import { buildSyncCode, parseSyncCode, buildShareLink, copyText } from '../utils/syncUtils'
import { serializeState, hydrateState } from '../utils/storageUtils'

export default function SyncDialog({ open, onClose, state, dispatch }) {
  const [importCode, setImportCode] = useState('')
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  function showSnack(msg, severity = 'success') {
    setSnack({ open: true, msg, severity })
  }

  function handleCopyCode() {
    const code = buildSyncCode(serializeState(state))
    copyText(code)
      .then(() => showSnack('同步碼已複製，到另一台裝置貼上即可。'))
      .catch(() => showSnack('複製失敗，請手動長按選取後複製。', 'error'))
  }

  function handleCopyLink() {
    const code = buildSyncCode(serializeState(state))
    copyText(buildShareLink(code))
      .then(() => showSnack('分享連結已複製，在另一台裝置打開即可匯入。'))
      .catch(() => showSnack('複製失敗', 'error'))
  }

  function handleImport() {
    const code = importCode.trim()
    if (!code) { showSnack('請先貼上同步碼', 'warning'); return }
    try {
      const data = parseSyncCode(code)
      const hydrated = hydrateState(data)
      if (!hydrated) { showSnack('同步碼內容無法辨識', 'error'); return }
      if (!window.confirm('匯入後會取代這台裝置目前的所有資料，確定要匯入嗎？')) return
      dispatch({ type: 'LOAD_STATE', payload: hydrated })
      setImportCode('')
      onClose()
      showSnack('匯入完成')
    } catch {
      showSnack('同步碼格式不正確，請確認是否完整複製。', 'error')
    }
  }

  const exportCode = open ? buildSyncCode(serializeState(state)) : ''

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>🔄 跨裝置同步</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            純前端網頁、資料不會上傳伺服器。用「同步碼」把資料從一台裝置搬到另一台。
          </Typography>

          <Typography variant="subtitle2" fontWeight={900} gutterBottom>① 我這台的同步碼（複製後到另一台貼上）</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={exportCode}
            InputProps={{ readOnly: true }}
            inputProps={{ style: { fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' } }}
            size="small"
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" size="small" onClick={handleCopyCode} sx={{ flex: 1 }}>複製同步碼</Button>
            <Button variant="outlined" color="secondary" size="small" onClick={handleCopyLink} sx={{ flex: 1 }}>複製分享連結</Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={900} gutterBottom>② 貼上其他裝置的同步碼（匯入到這台）</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            placeholder="把另一台複製的同步碼貼在這裡"
            size="small"
            inputProps={{ style: { fontFamily: 'monospace', fontSize: 11 } }}
          />
          <Button fullWidth variant="contained" size="small" onClick={handleImport} sx={{ mt: 1 }}>
            匯入這份資料
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>關閉</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </>
  )
}
