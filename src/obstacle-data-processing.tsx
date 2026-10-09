import lineIntersect from '@turf/line-intersect'
import length from '@turf/length'

import type { OSMID } from './osrm-api/types'
import type { LineString, Position } from 'geojson'
import type { ObstacleOnRoute, OverpassWay, RouteSegment } from './types'

export async function getObstacleInfo(segments: RouteSegment[], tunnels: OverpassWay[], crossings: OverpassWay[]): Promise<[RouteSegment[], ObstacleOnRoute[]]> {
  const obstacleDataImportPromise = fetch('/obstacle_data.json')
    .then((res) => res.json())
    .then(
      (json) =>
        json as Record<OSMID, Omit<ObstacleOnRoute, 'obstacle' | 'nodeid'>>
    )
  const obstacleData = await obstacleDataImportPromise

  const tunnelsOnRoute: ObstacleOnRoute[] = []
  const crossingsOnRoute: ObstacleOnRoute[] = []

  tunnels.forEach((tunnel) => {
    const intersections: number[] = []
    segments.forEach((segment, idx) => {
      const segmentGeom : LineString = {
        type: 'LineString',
        coordinates: [segment.begin_coord, segment.end_coord]
      }
      const obstacleCoords = tunnel.geometry.map<Position>((latLon) => [
        latLon.lon,
        latLon.lat
      ])
      const obstacleGeometry: LineString = {
        type: 'LineString',
        coordinates: obstacleCoords
      }
      const intersection = lineIntersect(segmentGeom, obstacleGeometry)
      if (intersection.features.length > 0) {
        intersections.push(idx)
      }
    })

    const newEntry = {
      obstacle: tunnel,
      segmentIndices: intersections
    }
    tunnelsOnRoute.push(newEntry)
  })

  crossings.forEach((crossing) => {
    const intersections: number[] = []
    segments.forEach((segment, idx) => {
      const segmentGeom : LineString = {
        type: 'LineString',
        coordinates: [segment.begin_coord, segment.end_coord]
      }
      const obstacleCoords = crossing.geometry.map<Position>((latLon) => [
        latLon.lon,
        latLon.lat
      ])
      const obstacleGeometry: LineString = {
        type: 'LineString',
        coordinates: obstacleCoords
      }
      const intersection = lineIntersect(segmentGeom, obstacleGeometry)
      if (intersection.features.length > 0) {
        intersections.push(idx)
      }
    })

    const newEntry = {
      obstacle: crossing,
      segmentIndices: intersections
    }
    crossingsOnRoute.push({ ...newEntry, ...obstacleData[crossing.id] })
  })

  const usedBastIds: string[] = []

  crossingsOnRoute.forEach((crossing) => {
    if (!(crossing.segmentIndices.length === 0)) {
      let obstructedDist: number = 0
      const speedAtObstacle = segments[crossing.segmentIndices[0]!]!.trace_speed ?? segments[crossing.segmentIndices[0]!]!.speed
      if (speedAtObstacle === 0) {
        console.warn("Speed at obstacle is < 1m/s skipping crossing", crossing)
      } else {
        if (crossing.bast_width && crossing.bwnr_tbwnr) {
          if (!usedBastIds.includes(crossing.bwnr_tbwnr)) {
            usedBastIds.push(crossing.bwnr_tbwnr)
            obstructedDist = crossing.bast_width
          }
        } else {
          obstructedDist =
            crossing.osm_width ?? crossing.est_width ?? crossing.nn_width!
        }
        if (segments[crossing.segmentIndices[0]!]!.distance_under_obstruction){
          segments[crossing.segmentIndices[0]!]!.distance_under_obstruction! += obstructedDist
        } else {
          segments[crossing.segmentIndices[0]!]!.distance_under_obstruction = obstructedDist
        }
        if (segments[crossing.segmentIndices[0]!]!.time_under_obstruction){
          segments[crossing.segmentIndices[0]!]!.time_under_obstruction! += obstructedDist / speedAtObstacle
        } else {
          segments[crossing.segmentIndices[0]!]!.time_under_obstruction = obstructedDist / speedAtObstacle
        }
      }
    }
  })

  tunnelsOnRoute.forEach((tunnel) => {
    if (tunnel.segmentIndices.length > 0){
      const speedAtObstacle = segments[tunnel.segmentIndices[0]!]!.trace_speed ?? segments[tunnel.segmentIndices[0]!]!.speed
      if (speedAtObstacle === 0) {
        console.warn("Speed at obstacle is < 1m/s skipping tunnel", tunnel)
      } else {
        const tunnelCoords = tunnel.obstacle.geometry.map<Position>((latLon_1) => [
          latLon_1.lon,
          latLon_1.lat
        ])
        const tunnelGeometry: LineString = {
          type: 'LineString',
          coordinates: tunnelCoords
        }
        const obstructedDist: number = length(tunnelGeometry, { units: 'meters' })
        if (segments[tunnel.segmentIndices[0]!]!.distance_under_obstruction) {
          segments[tunnel.segmentIndices[0]!]!.distance_under_obstruction! +=
            obstructedDist
        } else {
          segments[tunnel.segmentIndices[0]!]!.distance_under_obstruction =
            obstructedDist
        }
        if (segments[tunnel.segmentIndices[0]!]!.time_under_obstruction) {
          segments[tunnel.segmentIndices[0]!]!.time_under_obstruction! +=
            obstructedDist / speedAtObstacle
        } else {
          segments[tunnel.segmentIndices[0]!]!.time_under_obstruction =
            obstructedDist / speedAtObstacle
        }
      }
    }
  })

  return [segments, tunnelsOnRoute.concat(crossingsOnRoute) as ObstacleOnRoute[]]
}