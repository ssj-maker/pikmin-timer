import { Box, Typography } from '@mui/material'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import LocationCard from './LocationCard'
import { getTimerStatus, sortLocationList } from '../utils/timeUtils'

function GroupHeader({ label, count, color }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
      <FiberManualRecordIcon sx={{ fontSize: 10, color }} />
      <Typography fontSize={13} fontWeight={900} color="text.secondary">
        {label}
      </Typography>
      <Typography fontSize={12} fontWeight={800} color="text.disabled">
        {count} 個{label.includes('倒數') ? '進行中' : '地點'}
      </Typography>
    </Box>
  )
}

export default function LocationList({ locations, dispatch, now, warnMs }) {
  const active = sortLocationList(locations.filter((l) => getTimerStatus(l, now) === 0), now)
  const normalWaiting = sortLocationList(locations.filter((l) => l.type === '正常位置' && getTimerStatus(l, now) !== 0), now)
  const preciseWaiting = sortLocationList(locations.filter((l) => l.type === '關精準位置' && getTimerStatus(l, now) !== 0), now)

  if (!locations.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
        <Typography fontSize={14}>還沒有地點，先新增一個吧！</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {active.length > 0 && (
        <Box>
          <GroupHeader label="正在倒數" count={active.length} color="#fb8c00" />
          {active.map((l) => <LocationCard key={l.id} location={l} dispatch={dispatch} now={now} warnMs={warnMs} />)}
        </Box>
      )}
      {normalWaiting.length > 0 && (
        <Box>
          <GroupHeader label="正常位置（待處理）" count={normalWaiting.length} color="#43a047" />
          {normalWaiting.map((l) => <LocationCard key={l.id} location={l} dispatch={dispatch} now={now} warnMs={warnMs} />)}
        </Box>
      )}
      {preciseWaiting.length > 0 && (
        <Box>
          <GroupHeader label="關精準位置（待處理）" count={preciseWaiting.length} color="#7e57c2" />
          {preciseWaiting.map((l) => <LocationCard key={l.id} location={l} dispatch={dispatch} now={now} warnMs={warnMs} />)}
        </Box>
      )}
    </Box>
  )
}
