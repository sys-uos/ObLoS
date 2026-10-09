import React from 'react'
import { LayerGroup, LayersControl, Polyline } from 'react-leaflet'

import type { MatchTracepoint } from '../../osrm-api/types'

/**
 * Props for the TracepointLayer component.
 */
interface Props {
  /**
   * Array of tracepoints from the OSRM matching API response.
   * Each tracepoint contains location data to be rendered.
   */
  tracepoints: MatchTracepoint[]
}

/**
 * A component that renders tracepoints from a GPS trace as a polyline on the map.
 * Used to visualize the matched input points from the OSRM matching API.
 */
function TracepointLayer({ tracepoints }: Props) {
  // Extract location coordinates from each tracepoint
  const coordinates = tracepoints.map(tracepoint => tracepoint.location)

  return (
    // Add tracepoints as an overlay layer in the LayersControl
    <LayersControl.Overlay checked name='Tracepoints'>
      <LayerGroup>
        {/* Render the tracepoints as a magenta polyline */}
        <Polyline
          // Convert coordinates from [lat, lon] to [lon, lat] for Leaflet compatibility
          positions={coordinates.map(([lat, lon]) => [lon, lat])}
          color={'magenta'}
        >
        </Polyline>
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default React.memo(TracepointLayer)