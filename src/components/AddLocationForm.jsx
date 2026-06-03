import { useState } from 'react'
import { Box, TextField, Button, Alert, Snackbar } from '@mui/material'
import { MAX_NAME_LENGTH } from '../utils/timeUtils'

export default function AddLocationForm({ dispatch }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function add(type) {
    const trimmed = name.trim()
    if (!trimmed) { setError('請先輸入地點名稱'); return }
    if (trimmed.length > MAX_NAME_LENGTH) { setError(`地點名稱最多 ${MAX_NAME_LENGTH} 個字`); return }
    dispatch({ type: 'ADD_LOCATION', payload: { locType: type, name: trimmed } })
    setName('')
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <TextField
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') add('正常位置') }}
        placeholder="輸入地點，最多 8 字"
        size="small"
        inputProps={{ maxLength: MAX_NAME_LENGTH }}
        sx={{ flex: '1 1 160px', minWidth: 0 }}
      />
      <Button variant="contained" size="small" onClick={() => add('正常位置')} sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        ＋ 正常位置
      </Button>
      <Button variant="contained" color="secondary" size="small" onClick={() => add('關精準位置')} sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        ＋ 關精準位置
      </Button>
      <Snackbar open={!!error} autoHideDuration={2500} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="warning" onClose={() => setError('')} sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
    </Box>
  )
}
