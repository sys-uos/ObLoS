import OSRMApi from '../osrm-api'
import type { LonLatTuple, MatchServiceResponse, RouteServiceResponse } from '../osrm-api/types'
import type { OverpassWayBody, RouteSegment } from '../types'
import type { OverpassApiClient } from '../overpass-api-client/overpass-client'

export class OSRMApiClient {
  private routing_api: OSRMApi

  constructor(opts?: { routing_api?: OSRMApi }) {
    this.routing_api = opts?.routing_api ?? new OSRMApi()
  }

  private lookupRoute = async (
    startCoords: LonLatTuple,
    endCoords: LonLatTuple
  ): Promise<RouteServiceResponse<{
    service: "route"
    profile: "car"
    coordinates: [number, number][]
    geometries: "geojson"
    steps: boolean
    annotations: "true"
    overview: "full"
  }>> => {
    return await this.routing_api.route_request({
      service: 'route',
      profile: 'car',
      coordinates: [startCoords,endCoords],
      geometries: 'geojson',
      steps: true,
      annotations: 'true',
      overview: "full"
    })
  }

  private getRouteSegmentsFromRouting = (routingResponse: RouteServiceResponse<{
    service: "route"
    profile: "car"
    coordinates: LonLatTuple[]
    geometries: "geojson"
    steps: boolean
    annotations: "true"
    overview: "full"
  }>, maxSpeed: number, ways: OverpassWayBody[]) : RouteSegment[] => {
    // convert the max speed to m/s
    maxSpeed = maxSpeed  / 3.6
    const segments: RouteSegment[] = []
    let total_distance = 0
    let total_duration = 0
    for (const route of routingResponse.routes) {
      let route_segment_idx = 0
      for (const leg of route.legs){
        let distance_since_leg_start = 0;
        let time_since_leg_start = 0;
        for ( let i = 0; i < leg.annotation.nodes.length-1; i++ ){
          const startNode = leg.annotation.nodes[i]!
          const endNode = leg.annotation.nodes[i + 1]!
          // find the way that the segment is part of
          const curr_way = ways.find(way =>
            way.nodes.includes(startNode) && way.nodes.includes(endNode)
          )
          let speed_limit: string | undefined = undefined;
          if (curr_way) {speed_limit = (curr_way.tags["maxspeed"])}
          let adjusted_duration = leg.annotation.duration[i]!
          let adjusted_speed = leg.annotation.speed[i]!
          // if the speed is above the max speed, increase the duration of the segment to match the max speed
          if (leg.annotation.speed[i]! > maxSpeed) {
            adjusted_duration = leg.annotation.duration[i]! * (leg.annotation.speed[i]! / (maxSpeed))
            adjusted_speed = maxSpeed
          }

          // if the speed is above 110 km/h and the speed_limit none, reduce the duration of the segment to match the max speed
          if (speed_limit && speed_limit ==="none" && leg.annotation.speed[i]! >( 110  / 3.6)) {
            adjusted_duration = leg.annotation.duration[i]! * (leg.annotation.speed[i]! / (maxSpeed))
            adjusted_speed = maxSpeed
          }

          total_distance += leg.annotation.distance[i]!
          total_duration += adjusted_duration
          distance_since_leg_start += leg.annotation.distance[i]!
          time_since_leg_start += adjusted_duration
          segments.push(
            {
              begin_node: startNode,
              begin_coord: route.geometry!.coordinates[route_segment_idx]! as LonLatTuple,
              end_node: endNode,
              end_coord: route.geometry!.coordinates[route_segment_idx+1]! as LonLatTuple,
              distance: leg.annotation.distance[i]!,
              distance_along_route: total_distance,
              duration: adjusted_duration,
              duration_along_route: total_duration,
              duration_since_leg_start: time_since_leg_start,
              speed: adjusted_speed,
              osm_speed_limit: speed_limit,
              osrm_speed: leg.annotation.speed[i]!
            })
          route_segment_idx++
        }
      }
    }
    return segments
  }

  private lookupMatch = async (
      coordinates: LonLatTuple[],
      timestamps?: number[],
      radiuses?: number[]
    ) : Promise<MatchServiceResponse<{
    radiuses?: number[] | undefined
    timestamps?: number[] | undefined
    service: "match"
    profile: "car"
    coordinates: LonLatTuple[]
    geometries: "geojson"
    steps: true
    annotations: "true"
    gaps: "ignore"
    overview: "full"
  }>> => {
      if (!coordinates || coordinates.length < 2) {
        throw new Error('Route requires at least two coordinates');
      }

      const includeTimestamps =
        Array.isArray(timestamps) && timestamps.length === coordinates.length
      const includeRadiuses =
        Array.isArray(radiuses) && radiuses.length === coordinates.length

      return await this.routing_api.match_request({
        service: 'match',
        profile: 'car',
        coordinates: coordinates,
        geometries: 'geojson',
        steps: true,
        annotations: 'true',
        gaps: 'ignore',
        overview: "full",
        ...(includeTimestamps ? { timestamps } : {}),
        ...(includeRadiuses ? { radiuses } : {})
      })
    }

  private getRouteSegmentsFromMatch = (matchResponse: MatchServiceResponse<{
    radiuses?: number[] | undefined
    timestamps?: number[] | undefined
    service: "match"
    profile: "car"
    coordinates: LonLatTuple[]
    geometries: "geojson"
    steps: true
    annotations: "true"
    gaps: "ignore"
  }>, trace_timestamps?: number[] | undefined, trace_speeds?: number[] | undefined) : RouteSegment[] => {
    if (trace_timestamps) {
      if (trace_timestamps.length !== matchResponse.tracepoints.length) throw new Error(
        'trace_timestamps must have the same length as the tracepoints'
      )
    }
    if (trace_speeds) {
      if (trace_speeds.length !== matchResponse.tracepoints.length) throw new Error(
        'trace_speeds must have the same length as the tracepoints'
      )
    }
    if (trace_timestamps) {
      console.log("input trace_timestamps:",trace_timestamps)
      trace_timestamps = trace_timestamps.filter(
        (_, i) => matchResponse.tracepoints[i] !== null
      )
      console.log("filtered trace_timestamps:",trace_timestamps)
    }
    if (trace_speeds) {
      console.log("input trace_speeds:",trace_speeds)
      trace_speeds = trace_speeds.filter(
        (_, i) => matchResponse.tracepoints[i] !== null
      )
      console.log("filtered trace_speeds:",trace_speeds)
    }
    const trace_leg_delta_times: number[] | undefined = trace_timestamps?.map((timestamp) => timestamp - trace_timestamps[0]!)
    const segments: RouteSegment[] = []
    let total_distance = 0
    let total_duration = 0
    let trace_idx = 0
    for (const matching of matchResponse.matchings) {
      let matching_segment_idx = 0;
      for (const leg of matching.legs){
        const trace_leg_begin: number | undefined = trace_timestamps?.[trace_idx]
        const trace_leg_speed: number | undefined = trace_speeds?.[trace_idx]
        const trace_leg_delta_time: number | undefined = trace_leg_delta_times?.[trace_idx]
        let distance_since_leg_start = 0;
        let time_since_leg_start = 0;
        for ( let i = 0; i < leg.annotation.nodes.length-1; i++ ){
          segments.push(
            {
              begin_node: leg.annotation.nodes[i]!,
              begin_coord: matching.geometry!.coordinates[matching_segment_idx]! as LonLatTuple,
              end_node: leg.annotation.nodes[i+1]!,
              end_coord: matching.geometry!.coordinates[matching_segment_idx+1]! as LonLatTuple,
              distance: leg.annotation.distance[i]!,
              distance_along_route: total_distance,
              duration: leg.annotation.duration[i]!,
              duration_along_route: total_duration,
              duration_since_leg_start: time_since_leg_start,
              trace_leg_start_timestamp: trace_leg_begin,
              trace_speed: trace_leg_speed,
              speed: leg.annotation.speed[i]!,
              trace_delta_time: trace_leg_delta_time !== undefined ? trace_leg_delta_time + time_since_leg_start : undefined
            })
          total_distance += leg.annotation.distance[i]!
          total_duration += leg.annotation.duration[i]!
          distance_since_leg_start += leg.annotation.distance[i]!
          time_since_leg_start += leg.annotation.duration[i]!
          matching_segment_idx++
        }
        trace_idx++
      }
      trace_idx++
    }
    return segments
  }
  public async getRouteSegmentsFromRoutingApi(startCoords: LonLatTuple, endCoords: LonLatTuple, maxSpeed: number, overpass_client: OverpassApiClient) {
    const routingResponse = await this.lookupRoute(startCoords, endCoords)
    console.log("routingResponse:",routingResponse)
    const nodeIDs = routingResponse.routes.flatMap(route => route.legs.flatMap(leg => leg.annotation.nodes))
    const {ways, tunnels, crossings} = await overpass_client.getOverpassObstacleData(nodeIDs)
    return {segments: this.getRouteSegmentsFromRouting(routingResponse, maxSpeed, ways), tunnels, crossings}
  }

  public async getRouteSegmentsFromMatchingApi(
    coordinates: LonLatTuple[],
    timestamps?: number[],
    radiuses?: number[],
    speeds?: number[]
  ) {
    const matchingResponse = await this.lookupMatch(coordinates, timestamps, radiuses)
    console.log("matchingResponse:",matchingResponse)
    return this.getRouteSegmentsFromMatch(matchingResponse, timestamps, speeds)
  }
}
