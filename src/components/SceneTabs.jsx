import { useState } from 'react'
import {
  Box, Tab, Tabs, IconButton, TextField, Button, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { MAX_SCENES, MAX_NAME_LENGTH } from '../utils/timeUtils'

export default function SceneTabs({ scenes, currentSceneId, dispatch }) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [addingScene, setAddingScene] = useState(false)
  const [newSceneName, setNewSceneName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const currentIdx = scenes.findIndex((s) => s.id === currentSceneId)

  function handleTabChange(_, newIdx) {
    dispatch({ type: 'SWITCH_SCENE', payload: { id: scenes[newIdx].id } })
  }

  function startEdit(scene) {
    setEditingId(scene.id)
    setEditName(scene.name)
  }

  function confirmEdit() {
    const name = editName.trim()
    if (!name) return
    if (name.length > MAX_NAME_LENGTH) return
    dispatch({ type: 'UPDATE_SCENE_NAME', payload: { id: editingId, name } })
    setEditingId(null)
  }

  function startAdd() {
    setNewSceneName('')
    setAddingScene(true)
  }

  function confirmAdd() {
    const name = newSceneName.trim()
    if (!name || name.length > MAX_NAME_LENGTH) return
    dispatch({ type: 'ADD_SCENE', payload: { name } })
    setAddingScene(false)
  }

  function confirmDelete() {
    dispatch({ type: 'DELETE_SCENE', payload: { id: deleteConfirmId } })
    setDeleteConfirmId(null)
  }

  const current = scenes.find((s) => s.id === currentSceneId)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tabs
          value={currentIdx < 0 ? 0 : currentIdx}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flex: 1, minWidth: 0, '& .MuiTab-root': { minWidth: 0, px: 1.5, fontWeight: 700, fontSize: 13 } }}
        >
          {scenes.map((scene) => (
            <Tab
              key={scene.id}
              label={
                editingId === scene.id ? (
                  <TextField
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') confirmEdit()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    inputProps={{ maxLength: MAX_NAME_LENGTH, style: { fontSize: 13, padding: '4px 6px', width: 80 } }}
                    size="small"
                    autoFocus
                    variant="outlined"
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{scene.name}</span>
                    <EditIcon
                      sx={{ fontSize: 14, opacity: 0.6 }}
                      onClick={(e) => { e.stopPropagation(); startEdit(scene) }}
                    />
                  </Box>
                )
              }
            />
          ))}
        </Tabs>
        {scenes.length < MAX_SCENES && (
          <IconButton size="small" onClick={startAdd} sx={{ flexShrink: 0 }}>
            <AddIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {current && current.id !== 'scene_1' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirmId(current.id)}
            sx={{ fontSize: 12 }}
          >
            刪除此場景
          </Button>
        </Box>
      )}

      {/* Add scene dialog */}
      <Dialog open={addingScene} onClose={() => setAddingScene(false)} maxWidth="xs" fullWidth>
        <DialogTitle>新增場景</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="場景名稱"
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmAdd() }}
            inputProps={{ maxLength: MAX_NAME_LENGTH }}
            helperText={`最多 ${MAX_NAME_LENGTH} 字`}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddingScene(false)}>取消</Button>
          <Button variant="contained" onClick={confirmAdd} disabled={!newSceneName.trim()}>確定</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>刪除場景</DialogTitle>
        <DialogContent>
          <DialogContentText>刪除後無法回復，確定要刪除此場景嗎？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>取消</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>確認刪除</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
