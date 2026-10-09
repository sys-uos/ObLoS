import React from 'react'
import { LayerGroup, LayersControl, Polyline, Popup } from 'react-leaflet'
import { useMediaQuery } from '@mui/material'

import type { ObstacleOnRoute } from '../../types'

/**
 * Props for the ObstaclesLayer component.
 */
interface Props {
  /**
   * Array of obstacles to display on the map.
   */
  obstacles: ObstacleOnRoute[]
  /**
   * Name of the route, used for the layer control label.
   */
  routeName: string
}

/**
 * A React-Leaflet component that renders obstacle geometries as polylines
 * on the map, with popups displaying obstacle details.
 */
function ObstaclesLayer({ obstacles, routeName }: Props) {
  // Detect if user prefers dark mode for appropriate line color
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  // Log obstacles for debugging purposes
  console.log("obstacles to draw:",obstacles)

  return (
    // Create an overlay layer in the LayersControl for this route's obstacles
    <LayersControl.Overlay checked={true} name={routeName + ' Obstacles'}>
      <LayerGroup>
        {/* Map through all obstacles and render each as a polyline */}
        {obstacles.map((obstacle) => {
          return (
            <Polyline
              key={obstacle.obstacle.id}
              // Convert obstacle geometry to Leaflet-compatible [lat, lon] format
              positions={obstacle.obstacle.geometry.map(({ lat, lon }) => [
                lat,
                lon
              ])}
              pathOptions={{
                // Use white for dark mode, darkblue for light mode
                color: prefersDarkMode ? 'white' : 'darkblue'
              }}
            >
              <Popup>
                {/* Display OSM ID of the obstacle */}
                OSM ID: {obstacle.obstacle.id}
                {/* Map through defined properties to display obstacle details in popup */}
                {(
                  [
                    ['bast_name', 'BASt name', ''],
                    ['osm_name', 'OSM name', ''],
                    ['est_width', 'Estimated width', ' m'],
                    ['nn_width', 'Est. width from NN', ' m'],
                    ['osm_width', 'OSM width', ' m'],
                    ['bast_width', 'BASt width', ' m'],
                    ['bwnr_tbwnr', 'BWNR', '']
                  ] as const
                ).map(([prop, prefix, suffix]) => {
                  // Skip properties that are undefined or null
                  if (!obstacle[prop]) {
                    return null
                  }
                  return (
                    <div key={prop}>
                      {prefix}:{' '}
                      {/* Format numbers to 2 decimal places, otherwise display as-is */}
                      {typeof obstacle[prop] === 'number' ?
                        obstacle[prop].toFixed(2)
                        : obstacle[prop]}
                      {suffix}
                    </div>
                  )
                })}
              </Popup>
            </Polyline>
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default React.memo(ObstaclesLayer)