import React from 'react'
import { LayerGroup, LayersControl } from 'react-leaflet'
import RoutePolyline from './components/RoutePolyline'

import type {
  ObstacleOnRoute,
  RouteSegment
} from '../../types'
import ObstaclesLayer from '../ObstaclesLayer'

/**
 * Props for the RouteLayer component.
 */
interface Props {
  /**
   * The maximum speed used for color scaling of the route segments.
   */
  maxSpeed: number
  /**
   * Array of route segments to be rendered as polylines.
   */
  segments: RouteSegment[]
  /**
   * Array of obstacles associated with the route.
   */
  obstacles: ObstacleOnRoute[]
  /**
   * Name of the route, used for labeling in the layer control.
   */
  routeName: string
}

/**
 * A component that renders route segments and associated obstacles
 * as map layers within a Leaflet map control.
 */
function RouteLayer({
                      maxSpeed,
                      segments,
                      obstacles,
                      routeName
                    }: Props) {
  // Debug log for route segments
  console.log("route to draw:",segments)

  // Filter obstacles to only include those assigned to at least one segment
  const obstacles_to_draw = obstacles?.filter(crossing => crossing.segmentIndices.length > 0) ?? []

  // Debug log for filtered obstacles
  console.log("obstacles to draw:",obstacles_to_draw)

  return (
    <>
      {/* Add route segments to the map layers control */}
      <LayersControl.Overlay checked={true} name={routeName}>
        <LayerGroup>
          {/* Render each segment as a polyline with speed-based coloring */}
          {segments.map((segment, i) => {
            return (
              <RoutePolyline
                key={routeName + '-' + i}
                max_speed={maxSpeed}
                segment={segment}
                segmentIdx={i}
              />
            )
          })}
        </LayerGroup>
      </LayersControl.Overlay>

      {/* Conditionally render obstacles layer if obstacles exist for this route */}
      {obstacles_to_draw && obstacles_to_draw.length > 0 && (
        <ObstaclesLayer routeName={routeName} obstacles={obstacles_to_draw} />
      )}
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default React.memo(RouteLayer)