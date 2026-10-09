import React from 'react'
import { Button } from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'
import type { ObstacleOnRoute, RouteSegment } from '../../types'
import { downloadRouteSegments } from './download-route-segments'

/**
 * Props for the DownloadRouteSegmentsButton component.
 */
interface Props {
  /**
   * Whether the button should be disabled.
   */
  disabled: boolean
  /**
   * The route data containing segments and obstacles.
   */
  routes: Record<string, [RouteSegment[], ObstacleOnRoute[]]> | undefined
}

/**
 * A button component that triggers the download of route segments
 * as a CSV file containing segment data for each route.
 */
function DownloadRouteSegmentsButton({ disabled, routes }: Props) {
  return (
    <Button
      // Integrates with Leaflet map controls styling
      className='leaflet-control'
      // Adds margin for spacing within the map control container
      sx={{ margin: 3 }}
      variant='contained'
      color='primary'
      startIcon={<DownloadIcon />}
      // Disable if explicitly disabled or if no route data is available
      disabled={disabled || !routes}
      // Trigger the download function with the current routes data
      onClick={() => downloadRouteSegments(routes)}
    >
      Download route segments
    </Button>
  )
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default React.memo(DownloadRouteSegmentsButton)