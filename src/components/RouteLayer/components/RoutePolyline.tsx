import React from 'react'
import { Polyline, Popup } from 'react-leaflet'
import chroma from 'chroma-js'

import type { LatLngExpression } from 'leaflet'
import type { RouteSegment } from '../../../types'

/**
 * Props for the RoutePolyline component.
 */
interface Props {
  /**
   * The maximum speed used for normalizing the color scale.
   */
  max_speed: number
  /**
   * The route segment data to be rendered.
   */
  segment: RouteSegment
  /**
   * The index of the segment within the route.
   */
  segmentIdx: number
}

/**
 * Color scale for segment speed visualization.
 * Maps relative speed to colors: Red (slow) -> Yellow -> Green (fast).
 */
const gradient = chroma.scale(['red', 'yellow', 'green'])

/**
 * Renders a single route segment as a polyline on the map.
 * Colors the segment based on speed relative to the maximum speed.
 * Displays detailed segment statistics in a popup on click.
 */
function RoutePolyline({
                         max_speed,
                         segment,
                         segmentIdx,
                       }: Props) {
  // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet compatibility
  const polylinePoints: LatLngExpression[] = [segment.begin_coord.toReversed() as [number,number], segment.end_coord.toReversed() as [number,number]];

  // Skip rendering if the segment has insufficient coordinate data
  if (polylinePoints.length < 2) return null;

  // Determine the speed value to use for coloring (trace speed takes precedence)
  const coloringSpeed = segment.trace_speed ?? segment.speed

  // Normalize speed to a 0-1 range for the color gradient
  // Converts m/s to km/h, subtracts a baseline (10 km/h), and normalizes against max_speed
  const relative_speed = Math.max(coloringSpeed*3.6 - 10, 0) / (max_speed - 10)
  // Get the hex color string based on the normalized speed
  const color_at_speed = gradient(relative_speed)

  return (
    <Polyline
      positions={polylinePoints}
      pathOptions={{
        color: color_at_speed.hex()
      }}
    >
      <Popup>
        {/* Speed Information */}
        Speed: {(segment.speed*3.6).toFixed(2)} km/h
        {segment.osrm_speed !== undefined && (
          <>
            <br />
            OSRM Speed: {(segment.osrm_speed*3.6).toFixed(2)} km/h
          </>
        )}
        {segment.osm_speed_limit !== undefined && (
          <>
            <br />
            OSM Maxspeed: {segment.osm_speed_limit} [km/h]
          </>
        )}
        {segment.trace_speed !== undefined && (
          <>
            <br />
            Trace Speed: {(segment.trace_speed*3.6).toFixed(2)} km/h
          </>
        )}
        <br />

        {/* Time Information */}
        Time spent in segment: {segment.duration.toFixed(2)} s
        {segment.time_under_obstruction !== undefined && (
          <>
            <br />
            Time under obstruction: {segment.time_under_obstruction.toFixed(2)} s
          </>
        )}
        <br />

        {/* Distance Information */}
        Segment length: {segment.distance.toFixed(2)} m<br />
        Distance up to this segment on route: {(segment.distance_along_route / 1000).toFixed(3)} km
        {segment.distance_under_obstruction !== undefined && (
          <>
            <br />
            Distance under obstruction: {segment.distance_under_obstruction.toFixed(2)} m
          </>
        )}
        {segment.duration_along_route !== undefined && (
          <>
            <br />
            Time up to this segment along route: {segment.duration_along_route.toFixed(2)} s
          </>
        )}
        {segment.duration_since_leg_start !== undefined && (
          <>
            <br />
            Time up to this segment since last waypoint: {segment.duration_since_leg_start.toFixed(2)} s
          </>
        )}
        {segment.trace_leg_start_timestamp !== undefined && (
          <>
            <br />
            Trace WP Timestamp realtime: {new Date(segment.trace_leg_start_timestamp*1000).toString()}
            <br />
            Trace WP Timestamp: {segment.trace_leg_start_timestamp}
          </>
        )}
        {segment.trace_delta_time !== undefined && (
          <>
            <br />
            Trace Time up to this segment since start: {segment.trace_delta_time.toFixed(2)} s
          </>
        )}
        <br />

        {/* Segment Metadata */}
        segmentIdx: {segmentIdx}
        <br />
        Begin nodeID: {segment.begin_node}
        <br />
        End nodeID: {segment.end_node}
      </Popup>
    </Polyline>
  )
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default React.memo(RoutePolyline)