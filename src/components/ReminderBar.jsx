import { useState, useRef } from 'react'
import { unlockAudio, previewSound } from '../utils/audioUtils'
import { Box, Chip, Popover, Typography, Switch, FormControlLabel, TextField } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'

function formatWarnShort(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m === 0) return `${sec}秒前`
  if (sec === 0) return `${m}分前`
  return `${m}分${sec}秒前`
}

export default function ReminderBar({ warnSeconds, soundEnabled, dispatch }) {
  const [anchor, setAnchor] = useState(null)
  const init = warnSeconds ?? 60
  const [mVal, setMVal] = useState(String(Math.floor(init / 60)))
  const [sVal, setSVal] = useState(String(init % 60))
  const mRef = useRef(null)
  const sRef = useRef(null)
  const refs = [mRef, sRef]

  const liveTotal = Number(mVal || 0) * 60 + Number(sVal || 0)
  const previewSeconds = liveTotal > 0 ? liveTotal : (warnSeconds ?? 60)

  function commit(nextM, nextS) {
    const total = Number(nextM || 0) * 60 + Number(nextS || 0)
    if (total > 0) dispatch({ type: 'SET_SETTINGS', payload: { warnSeconds: total } })
  }

  function focusField(idx, caret = 'start') {
    const el = refs[idx]?.current
    if (!el) return
    el.focus()
    requestAnimationFrame(() => {
      const pos = caret === 'end' ? el.value.length : 0
      try { el.setSelectionRange(pos, pos) } catch {}
    })
  }

  function handleKey(e, idx) {
    if (e.key === 'Enter') { setAnchor(null); return }
    const el = e.target
    if (e.key === 'ArrowLeft' && el.selectionStart === 0 && el.selectionEnd === 0 && idx > 0) {
      e.preventDefault(); focusField(idx - 1, 'end')
    } else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length && idx < 1) {
      e.preventDefault(); focusField(idx + 1, 'start')
    } else if (e.key === 'Backspace' && el.value === '' && idx > 0) {
      e.preventDefault(); focusField(idx - 1, 'end')
    }
  }

  function onMChange(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setMVal(v); commit(v, sVal)
    if (v.length >= 2) focusField(1, 'start')
  }
  function onSChange(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setSVal(v); commit(mVal, v)
  }

  const fieldSx = { width: 52 }
  const fieldInput = {
    inputMode: 'numeric', maxLength: 2,
    style: { textAlign: 'center', fontWeight: 700, padding: '6px 4px' },
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5, py: 0.5 }}>
      {/* 提醒時間 chip */}
      <Chip
        icon={<NotificationsIcon sx={{ fontSize: 15 }} />}
        label={formatWarnShort(warnSeconds ?? 60)}
        size="small"
        onClick={(e) => { unlockAudio(); setAnchor(e.currentTarget) }}
        sx={{
          fontWeight: 700,
          fontSize: 12,
          bgcolor: '#e8f5e9',
          color: 'primary.dark',
          cursor: 'pointer',
          '&:hover': { bgcolor: '#c8e6c9' },
        }}
      />

      {/* 音效開關（與系統通知權限無關，隨時可開） */}
      <FormControlLabel
        control={
          <Switch
            checked={soundEnabled}
            onChange={(e) => {
              const on = e.target.checked
              if (on) { unlockAudio(); previewSound() }
              dispatch({ type: 'SET_SETTINGS', payload: { soundEnabled: on } })
            }}
            size="small"
            color="primary"
          />
        }
        label={<Typography variant="caption" fontWeight={700} color={soundEnabled ? 'primary.dark' : 'text.disabled'}>音效</Typography>}
        sx={{ ml: 0, mr: 0, gap: 0.25 }}
      />

      {/* 提醒時間 popover（分 : 秒 兩格輸入） */}
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, borderRadius: 3 } }}
      >
        <Typography variant="caption" fontWeight={900} color="text.secondary" display="block" mb={1}>
          提前幾分幾秒提醒
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TextField inputRef={mRef} value={mVal} onChange={onMChange}
            onKeyDown={(e) => handleKey(e, 0)} placeholder="分" size="small"
            inputProps={fieldInput} sx={fieldSx} />
          <Typography fontWeight={900} color="text.secondary">分</Typography>
          <TextField inputRef={sRef} value={sVal} onChange={onSChange}
            onKeyDown={(e) => handleKey(e, 1)} placeholder="秒" size="small"
            inputProps={fieldInput} sx={fieldSx} />
          <Typography fontWeight={900} color="text.secondary">秒</Typography>
        </Box>
        <Typography variant="caption" color="primary.dark" display="block" mt={1.5}>
          將在重生前 {formatWarnShort(previewSeconds)} 發出提醒
        </Typography>
      </Popover>
    </Box>
  )
}
