import type {
  LonLatTuple,
  MatchTracepoint,
  OSMID,
  RouteStep
} from './osrm-api/types'
import type { LineString } from 'geojson'

interface LatLonObj {
  lat: number
  lon: number
}

interface OverpassCount {
  type: 'count'
  id: number
  tags: Record<'nodes' | 'ways' | 'relations' | 'total', string>
}

interface OverpassNode {
  type: 'node'
  id: number
  lat: number
  lon: number
}

interface OverpassWay {
  type: 'way'
  id: number
  bounds: {
    minlat: number
    minlon: number
    maxlat: number
    maxlon: number
  }
  geometry: LatLonObj[]
}

interface OverpassWayBody {
  type: 'way'
  id: number
  nodes: OSMID[]
  tags: Record<string, string>
}

interface ObstacleOnRoute {
  obstacle: OverpassWay
  segmentIndices: number[]
  osm_name?: string | null
  bast_name?: string | null
  est_width?: number
  nn_width?: number
  osm_width?: number | null
  bast_width?: number | null
  bwnr_tbwnr?: string | null
}

interface RouteInfo {
  steps: RouteStep<LineString>[]
  node_ids: OSMID[]
  tracepoints?: MatchTracepoint[]
  timestamps: number[]
  speeds: number[]
}

interface RouteSegment {
  begin_node: OSMID,
  begin_coord: LonLatTuple,
  end_node: OSMID,
  end_coord: LonLatTuple,
  distance: number,
  distance_along_route: number,
  duration: number,
  duration_along_route: number,
  duration_since_leg_start: number,
  trace_leg_start_timestamp?: number,
  speed: number,
  osrm_speed?: number,
  osm_speed_limit?: string,
  trace_speed?: number,
  time_under_obstruction?: number,
  distance_under_obstruction?: number,
  trace_delta_time?: number
}

interface RouteObstacleInfo {
  steps: RouteStep<LineString>[]
  node_ids: OSMID[]
  tracepoints?: MatchTracepoint[]
  crossings: ObstacleOnRoute[]
  tunnels: ObstacleOnRoute[]
  timestamps: number[]
  speeds: number[]
  time_under_obstruction: number[]
  distance_under_obstruction: number[]
}

export type {
  OverpassCount,
  OverpassNode,
  RouteSegment,
  OverpassWay,
  OverpassWayBody,
  ObstacleOnRoute,
  RouteInfo,
  RouteObstacleInfo
}
