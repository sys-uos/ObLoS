import React from 'react'
import type { Position } from 'geojson'
import chroma from 'chroma-js'
import { Polyline, Popup } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

/**
 * Props for the TimeUnderBridgeLine component.
 */
interface Props {
  /**
   * GeoJSON coordinates representing the line geometry.
   * Expected format: Array of [longitude, latitude] tuples.
   */
  coordinates: Position[]
  /**
   * The amount of time spent under a bridge or obstacle.
   * Used to determine the color of the line.
   */
  timeUnderBridge: number
}

/**
 * Color scale mapping time duration to colors.
 * Green (low time) -> Yellow -> Red (high time).
 */
const gradient = chroma.scale(['green', 'yellow', 'red'])

/**
 * Renders a polyline representing a route segment colored by
 * the time spent under a bridge or obstacle.
 */
function TimeUnderBridgeLine({ coordinates, timeUnderBridge }: Props) {
  // Do not render if there is no time under obstruction
  if (!timeUnderBridge) return <></>

  // Determine the color based on the duration under obstruction
  const color_at_time = gradient(timeUnderBridge)

  // Convert GeoJSON coordinates [lon, lat] to Leaflet LatLng [lat, lon]
  // Filter out invalid entries and ensure at least 2 coordinates per point
  const polylinePoints: LatLngExpression[] = coordinates
    .filter(Array.isArray) // Ensure valid array structure
    .filter(arr => arr.length >= 2) // Ensure sufficient coordinate data
    .map(arr => [arr[1], arr[0]] as [number, number]); // Swap to [lat, lon]

  // Skip rendering if not enough points to form a line
  if (polylinePoints.length < 2) return null;

  return (
    <Polyline
      positions={polylinePoints}
      color={color_at_time.hex()}
    >
      <Popup>{timeUnderBridge.toFixed(2)}</Popup>
    </Polyline>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(TimeUnderBridgeLine)