import { useState, useRef, useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import {
  Box, Paper, Typography, IconButton, TextField, Button,
  Chip, Collapse, Grid,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonIcon from '@mui/icons-material/Person'
import {
  formatClock, formatCountdown,
  getTimerStatus, DIRECTION_BUTTONS, DIRECTION_ARROW, MAX_NAME_LENGTH,
} from '../utils/timeUtils'

function secToLabel(total) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const p = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`
}

export default function LocationCard({ location, dispatch, now, warnMs = 60000 }) {
  const [swiped, setSwiped] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(location.name)
  const [showDirection, setShowDirection] = useState(false)
  const [showPeople, setShowPeople] = useState(false)
  const [peopleVal, setPeopleVal] = useState(location.peopleCount)
  const [hVal, setHVal] = useState('')
  const [mVal, setMVal] = useState('')
  const [sVal, setSVal] = useState('')
  const [timeError, setTimeError] = useState(false)
  const nameInputRef = useRef(null)
  const peopleInputRef = useRef(null)
  const hRef = useRef(null)
  const mRef = useRef(null)
  const sRef = useRef(null)
  const timeRefs = [hRef, mRef, sRef]

  const id = location.id
  const isPreciseOff = location.type === '關精準位置'
  const status = getTimerStatus(location, now)
  const diff = location.respawnTime ? location.respawnTime - now : null
  const isWarning = status === 0 && diff !== null && diff <= warnMs && diff > 0
  const isDone = status === 1

  // Focus when entering edit mode
  useEffect(() => { if (editingName) nameInputRef.current?.focus() }, [editingName])
  useEffect(() => { if (showPeople) peopleInputRef.current?.focus() }, [showPeople])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setSwiped(true),
    onSwipedRight: () => setSwiped(false),
    trackMouse: false,
    delta: 45,
    preventScrollOnSwipe: false,
  })

  function saveName() {
    const v = nameVal.trim()
    if (!v || v.length > MAX_NAME_LENGTH) return
    dispatch({ type: 'UPDATE_LOCATION', payload: { id, changes: { name: v } } })
    setEditingName(false)
  }

  function setDirection(dir) {
    dispatch({ type: 'UPDATE_LOCATION', payload: { id, changes: { direction: dir } } })
    setShowDirection(false)
  }

  function savePeople() {
    const v = peopleVal.trim()
    if (v && (!/^\d+$/.test(v) || Number(v) < 0)) return
    dispatch({ type: 'UPDATE_LOCATION', payload: { id, changes: { peopleCount: v } } })
    setShowPeople(false)
  }

  const hasTimeInput = !!(hVal.trim() || mVal.trim() || sVal.trim())
  const totalSeconds =
    Number(hVal.trim() || 0) * 3600 + Number(mVal.trim() || 0) * 60 + Number(sVal.trim() || 0)
  const timePreview = hasTimeInput && totalSeconds > 0 ? secToLabel(totalSeconds) : ''

  function clearTimeInputs() {
    setHVal(''); setMVal(''); setSVal('')
  }

  function startTimer() {
    if (!hasTimeInput) {
      dispatch({ type: 'CLEAR_TIMER', payload: { id } })
      return
    }
    if (!totalSeconds || totalSeconds <= 0) {
      setTimeError(true); setTimeout(() => setTimeError(false), 1500); return
    }
    dispatch({ type: 'START_TIMER', payload: { id, seconds: totalSeconds, inputLabel: secToLabel(totalSeconds) } })
    clearTimeInputs()
  }

  // Focus a time field and place the caret at start/end
  function focusTimeField(idx, caret = 'start') {
    const el = timeRefs[idx]?.current
    if (!el) return
    el.focus()
    requestAnimationFrame(() => {
      const pos = caret === 'end' ? el.value.length : 0
      try { el.setSelectionRange(pos, pos) } catch {}
    })
  }

  // Arrow-key navigation + backspace-on-empty between 時/分/秒
  function handleTimeKey(e, idx) {
    if (e.key === 'Enter') { startTimer(); return }
    const el = e.target
    if (e.key === 'ArrowLeft' && el.selectionStart === 0 && el.selectionEnd === 0 && idx > 0) {
      e.preventDefault(); focusTimeField(idx - 1, 'end')
    } else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length && idx < 2) {
      e.preventDefault(); focusTimeField(idx + 1, 'start')
    } else if (e.key === 'Backspace' && el.value === '' && idx > 0) {
      e.preventDefault(); focusTimeField(idx - 1, 'end')
    }
  }

  // Digits-only change; auto-advance to next field when full
  function handleTimeChange(setter, idx, maxLen) {
    return (e) => {
      const v = e.target.value.replace(/\D/g, '')
      setter(v)
      setTimeError(false)
      if (v.length >= maxLen && idx < 2) focusTimeField(idx + 1, 'start')
    }
  }

  const notSet = !location.respawnTime
  const accentColor = notSet ? '#bdbdb5' : (isPreciseOff ? '#7e57c2' : '#43a047')
  const warningBg = isWarning ? '#fff3e0' : 'background.paper'
  const warningBorder = isWarning ? '#fb8c00' : (!notSet && isPreciseOff ? '#d1c4e9' : 'divider')

  const timeFieldSx = { width: 48 }
  const timeInputProps = (maxLen) => ({
    maxLength: maxLen, inputMode: 'numeric',
    style: { textAlign: 'center', fontWeight: 700, padding: '6px 4px' },
  })

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, mb: 1.5 }}>
      {/* Swipe-to-delete background */}
      <Box
        sx={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 78,
          bgcolor: 'error.main', display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderRadius: '0 8px 8px 0', cursor: 'pointer',
        }}
        onClick={() => dispatch({ type: 'DELETE_LOCATION', payload: { id } })}
      >
        <DeleteIcon sx={{ color: '#fff' }} />
      </Box>

      {/* Main card */}
      <Paper
        {...swipeHandlers}
        elevation={1}
        sx={{
          position: 'relative',
          borderRadius: 2,
          border: `1px solid`,
          borderColor: warningBorder,
          bgcolor: warningBg,
          overflow: 'hidden',
          transform: swiped ? 'translateX(-78px)' : 'translateX(0)',
          transition: 'transform 0.18s ease',
          ...(isWarning && {
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 rgba(251,140,0,0)' },
              '50%': { boxShadow: '0 0 18px rgba(251,140,0,0.65)' },
              '100%': { boxShadow: '0 0 0 rgba(251,140,0,0)' },
            },
            animation: 'pulse 1.2s infinite',
          }),
        }}
      >
        {/* Left accent bar */}
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: isWarning ? '#fb8c00' : accentColor }} />

        <Box sx={{ pl: 1.5, pr: 1, py: 1 }}>
          <Grid container spacing={1} alignItems="flex-start">
            {/* Left: name + meta */}
            <Grid item xs={12} sm={5}>
              {editingName ? (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <TextField
                    inputRef={nameInputRef}
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                    size="small"
                    inputProps={{ maxLength: MAX_NAME_LENGTH }}
                    sx={{ flex: 1 }}
                  />
                  <Button size="small" variant="contained" onClick={saveName} sx={{ minWidth: 0, px: 1 }}>✓</Button>
                  <Button size="small" onClick={() => setEditingName(false)} sx={{ minWidth: 0, px: 1 }}>✕</Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography fontWeight={900} fontSize={16} noWrap sx={{ flex: 1 }}>
                    📍 {location.name}
                  </Typography>
                  <IconButton size="small" onClick={() => { setNameVal(location.name); setEditingName(true) }}>
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              )}

              {/* Direction + people row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={location.direction ? DIRECTION_ARROW[location.direction] || location.direction : '方位'}
                  onClick={() => { setShowDirection((v) => !v); setShowPeople(false) }}
                  sx={{ fontSize: 14, fontWeight: 900, bgcolor: location.direction ? '#eef4e8' : undefined,
                    color: location.direction ? '#3b6d11' : 'text.secondary', cursor: 'pointer', height: 24 }}
                />
                <Chip
                  size="small"
                  icon={<PersonIcon sx={{ fontSize: 14 }} />}
                  label={location.peopleCount || '人數'}
                  onClick={() => { setShowPeople((v) => !v); setShowDirection(false) }}
                  sx={{ fontSize: 12, cursor: 'pointer', height: 24,
                    color: location.peopleCount ? 'primary.dark' : 'text.secondary' }}
                />
                {/* Desktop delete */}
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => dispatch({ type: 'DELETE_LOCATION', payload: { id } })}
                  sx={{ ml: 'auto', display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              {/* Direction popover */}
              <Collapse in={showDirection}>
                <Box sx={{ mt: 1, p: 1, bgcolor: '#fbfdf9', border: '1px solid', borderColor: 'divider', borderRadius: 2, width: 'fit-content' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 32px)', gap: 0.5, mb: 0.5 }}>
                    {DIRECTION_BUTTONS.map((btn, i) => (
                      <Button
                        key={i}
                        size="small"
                        variant={location.direction === btn.value ? 'contained' : 'outlined'}
                        color={location.direction === btn.value ? 'primary' : 'inherit'}
                        onClick={() => btn.value && setDirection(btn.value)}
                        disabled={!btn.value}
                        sx={{ minWidth: 32, width: 32, height: 28, p: 0, fontSize: 14,
                          visibility: btn.value ? 'visible' : 'hidden' }}
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </Box>
                  <Button size="small" fullWidth onClick={() => setDirection('')} sx={{ fontSize: 11 }}>清除方位</Button>
                </Box>
              </Collapse>

              {/* People popover */}
              <Collapse in={showPeople}>
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <TextField
                    inputRef={peopleInputRef}
                    value={peopleVal}
                    onChange={(e) => setPeopleVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') savePeople(); if (e.key === 'Escape') setShowPeople(false) }}
                    placeholder="人數"
                    size="small"
                    inputProps={{ inputMode: 'numeric', style: { width: 60 } }}
                    sx={{ width: 80 }}
                  />
                  <Button size="small" variant="contained" onClick={savePeople} sx={{ minWidth: 0, px: 1 }}>確定</Button>
                  <Button size="small" onClick={() => { setPeopleVal(''); savePeople() }} sx={{ minWidth: 0, px: 1 }}>清除</Button>
                </Box>
              </Collapse>
            </Grid>

            {/* Right: timer */}
            <Grid item xs={12} sm={7}>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <TextField inputRef={hRef} value={hVal} onChange={handleTimeChange(setHVal, 0, 2)}
                    onKeyDown={(e) => handleTimeKey(e, 0)}
                    placeholder="時" size="small" error={timeError}
                    inputProps={timeInputProps(2)} sx={timeFieldSx} />
                  <Typography fontWeight={900} color="text.secondary">:</Typography>
                  <TextField inputRef={mRef} value={mVal} onChange={handleTimeChange(setMVal, 1, 2)}
                    onKeyDown={(e) => handleTimeKey(e, 1)}
                    placeholder="分" size="small" error={timeError}
                    inputProps={timeInputProps(2)} sx={timeFieldSx} />
                  <Typography fontWeight={900} color="text.secondary">:</Typography>
                  <TextField inputRef={sRef} value={sVal} onChange={handleTimeChange(setSVal, 2, 3)}
                    onKeyDown={(e) => handleTimeKey(e, 2)}
                    placeholder="秒" size="small" error={timeError}
                    inputProps={timeInputProps(3)} sx={timeFieldSx} />
                </Box>
                <Button variant="contained" size="small" onClick={startTimer} sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                  起算/清空
                </Button>
                <Typography
                  fontWeight={900}
                  fontSize={15}
                  sx={{
                    ml: 'auto',
                    color: isDone ? '#2e7d32' : status === 0 ? 'primary.dark' : 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {!location.respawnTime
                    ? '尚未設定'
                    : isDone
                    ? '✅ 已重生'
                    : `倒數 ${formatCountdown(diff)}`}
                </Typography>
              </Box>

              <Typography
                fontSize={11}
                sx={{ mt: 0.25, color: hasTimeInput ? (timePreview ? 'primary.dark' : 'error.main') : 'text.disabled' }}
              >
                {hasTimeInput
                  ? (timePreview ? `= ${timePreview}` : '請輸入大於 0 的時間')
                  : '輸入剩餘時間（時：分：秒），秒可超過 60，會自動進位'}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography fontSize={12} color="text.secondary" noWrap sx={{ flex: 1 }}>
                  剩 {location.inputTime || '尚未輸入'}｜完 {formatClock(location.finishTime ? new Date(location.finishTime) : null)}
                </Typography>
                <Typography fontSize={12} color="#c2185b" fontWeight={900} noWrap sx={{ flexShrink: 0 }}>
                  重生 {formatClock(location.respawnTime ? new Date(location.respawnTime) : null)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  )
}
