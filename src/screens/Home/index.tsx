import React, { useMemo, useState } from 'react'
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet'
import { Paper } from '@mui/material'

import RouteParametersPicker from '../../components/RouteParametersPicker'
import RouteLayer from '../../components/RouteLayer'
import DownloadRouteDataButton from '../../components/DownloadRouteDataButton'
import DownloadObstacleDataButton from '../../components/DownloadObstacleDataButton'
import DownloadRouteSegmentsButton from '../../components/DownloadRouteSegmentsButton'
import OSRMApi from '../../osrm-api'
import { OverpassApiClient } from '../../overpass-api-client/overpass-client'
import { OSRMApiClient} from '../../osrm-api-client/osrm-api-client'
import type { ObstacleOnRoute, RouteSegment } from '../../types'
import { getObstacleInfo } from '../../obstacle-data-processing'
import type { LonLatTuple } from '../../osrm-api/types'
import { downloadRouteData } from '../../components/DownloadRouteDataButton/download-route-data'
import { downloadObstacleData } from '../../components/DownloadObstacleDataButton/download-obstacle-data'
import { downloadRouteSegments } from '../../components/DownloadRouteSegmentsButton/download-route-segments'
import config from '../../osrm_config.json' with { type: 'json' };

const COORDS_OSNABRUECK: [number, number] = [52.2719595, 8.047635]

const routing_api = new OSRMApi(config.api_host)
const osrm_client = new OSRMApiClient({routing_api: routing_api})
const overpass_client = new OverpassApiClient(60000)

export default function HomeScreen() {
  const [maxSpeed, setMaxSpeed] = useState(130)
  const [fetchingRoute, setFetchingRoute] = useState(false)
  const [fetchingObstacles, setFetchingObstacles] = useState(false)
  const [routes, setRoutes] = useState<Record<string, [RouteSegment[], ObstacleOnRoute[]]>>({});
  const [defaultDownloadRouteData, setDefaultDownloadRouteData] = useState(false);

  // ensure that the route name is unique by appending a number if needed
  function getUniqueName(base: string, routes: Record<string, [RouteSegment[],ObstacleOnRoute[]]>) {
    if (!(base in routes)) return base
    let i = 1
    while ((`${base} [${i}]`) in routes) i++
    return `${base} [${i}]`
  }

  // function to delay multiple retries with exponential backoff to avoid overloading the server
  const delayWithBackoff = async (attempt: number) => {
    const baseDelay = 10000;   // 10 second
    const maxDelay = 1800000;   // 30 minutes
    // attempt is 1-based in this function (1 -> first retry)
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    // Jitter up to +/-50%
    const jitter = delay * (Math.random() * 0.5);
    const delayMs = Math.max(0, delay - jitter);
    console.log(`Backoff: waiting ${Math.round(delayMs / 1000)}s before retry ${attempt + 1}`);
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  };

  // Add a route to the map with the given segments and obstacles based on the proposed name.
  async function addRoute(proposedName: string, segments: RouteSegment[], obstacles: ObstacleOnRoute[]): Promise<void> {
    const name = getUniqueName(proposedName, routes)
    console.log(
      'adding route:',
      name,
      'segments:',
      segments,
      'obstacles:',
      obstacles,
      'defaultDownloadRouteData:',
      defaultDownloadRouteData,
    )
    // if defaultDownloadRouteData is true, download the route data immediately and don't add it to the map
    if (defaultDownloadRouteData) {
      downloadRouteData({ [name]: [segments, obstacles] })
      downloadObstacleData({ [name]: [segments, obstacles] })
      downloadRouteSegments({ [name]: [segments, obstacles] })
    } else {
      setRoutes((currentRoutes) => ({
        ...currentRoutes,
        [name]: [segments, obstacles]
      }))
      console.log('routes:', routes)
    }
  }

  // Add a route based on the given coordinates and route name using the routing API.
  async function addRouteFromRoutingApi(startCoords: LonLatTuple, endCoords: LonLatTuple, routeName: string) {
    setFetchingRoute(true);
    try {

      // Fetch obstacles with backoff
      setFetchingObstacles(true);
      let tries = 0;
      let success = false;
      let obstacleSegments: any;
      let obstacles: any;

      // Retry with backoff until success or max retries reached
      while (!success) {
        try {
          const { segments, tunnels, crossings } = await osrm_client.getRouteSegmentsFromRoutingApi(
            startCoords,
            endCoords,
            maxSpeed,
            overpass_client
          )
          console.log("segments:", segments);
          const [osSeg, obs] = await getObstacleInfo(segments, tunnels, crossings);
          obstacleSegments = osSeg;
          obstacles = obs;
          console.log("route obstacle Segments:", obstacleSegments);
          success = true;
        } catch (e) {
          console.error("Failed to get obstacle info at try:", tries + 1, "exception:", e);
          tries++;
          await delayWithBackoff(tries);
        }
      }

      // If success, add the route
      if (success) {
        await addRoute(routeName, obstacleSegments, obstacles);
      } else {
        console.warn("Could not fetch obstacle info after maximum retries.");
      }
    } catch (e) {
      console.error("Error in addRouteFromRoutingApi:", e);
    } finally {
      setFetchingObstacles(false);
      setFetchingRoute(false);
    }
  }

  // Add a route based on the given coordinates and route name using the matching API.
  async function addRouteFromMatchingApi(
    coordinates: LonLatTuple[],
    routeName: string,
    timestamps?: number[],
    radiuses?: number[],
    speeds?: number[]
  ) {
    setFetchingRoute(true);

    // fetch route segments
    let segments;
    try {
      segments = await osrm_client.getRouteSegmentsFromMatchingApi(coordinates, timestamps, radiuses, speeds);
      console.log("segments:", segments);
    } catch (e) {
      console.error("Failed to fetch route segments:", e);
      setFetchingRoute(false);
      return;
    }

    // fetch obstacles with backoff retry
    let tries = 0;
    let success = false;
    setFetchingObstacles(true);

    // Retry with backoff until success or max retries reached
    while (!success) {
      try {
        const {ways, tunnels, crossings} = await overpass_client.getOverpassObstacleData(segments.map(s => s.begin_node));
        const [obstacleSegments, obstacles] = await getObstacleInfo(segments, tunnels, crossings);
        console.log("route obstacle Segments:", obstacleSegments);
        await addRoute(routeName, obstacleSegments, obstacles);
        success = true;
      } catch (e) {
        console.error("Failed to get obstacle info at try:", tries + 1, "exception:", e);
        tries++;
        await delayWithBackoff(tries);
      }
    }

    // Cleanup flags after all attempts complete
    setFetchingObstacles(false);
    setFetchingRoute(false);
  }

  const routeButtonLoadingText = useMemo(() => {
    if (fetchingRoute) return 'Fetching route'
    if (fetchingObstacles) return 'Fetching obstacles'
    return undefined
  }, [fetchingRoute, fetchingObstacles])
  return (
    <>
      <MapContainer
        center={COORDS_OSNABRUECK}
        zoom={11}
        style={{ height: '100vh', width: '100%', padding: 0 }}
      >
        <TileLayer
          className='map-tiles'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <LayersControl position='topright'>
          <RouteParametersPicker
            addRouteFromRoutingApi={addRouteFromRoutingApi}
            addRouteFromMatchingApi={addRouteFromMatchingApi}
            setMaxSpeed={setMaxSpeed}
            loadingText={routeButtonLoadingText}
            setDefaultDownloadRouteData={setDefaultDownloadRouteData}
            defaultDownloadRouteData={defaultDownloadRouteData}
          />
          {Object.entries(routes).map(([routeName, [segments, obstacles]]) => {
            return (
              <RouteLayer
                key={routeName}
                routeName={routeName}
                segments={segments}
                obstacles={obstacles}
                maxSpeed={maxSpeed}
              />
            );
          })}
        </LayersControl>

        <div className='leaflet-bottom leaflet-left'>
          <DownloadRouteDataButton
            disabled={Object.keys(routes).length === 0}
            routes={routes}
          />
          <DownloadObstacleDataButton
            disabled={Object.keys(routes).length === 0}
            routes={routes}
          />
          <DownloadRouteSegmentsButton
            disabled={Object.keys(routes).length === 0}
            routes={routes}
          />
        </div>
      </MapContainer>
      {/*<Traces*/}
      {/*  timeUnderBridge={timeUnderBridge}*/}
      {/*  nodeData={nodeDataWithUpdatedSpeeds}*/}
      {/*  maxRtt={maxRtt}*/}
      {/*  pktsToRttNorm={pktsToRttNorm}*/}
      {/*/>*/}
      <div className='leaflet-bottom leaflet-right'>
        <div className='leaflet-control leaflet-bar'>
          <Paper sx={{ marginBottom: 3, paddingX: 1, width: 200 }}>
            <p>Speed Legend:</p>
            <div
              style={{
                width: '100%',
                height: 10,
                background: 'linear-gradient(to right, red, yellow, green)'
              }}
            ></div>
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              {[
                10,
                10 + (1 / 3) * (maxSpeed - 10),
                10 + (2 / 3) * (maxSpeed - 10),
                maxSpeed
              ].map((speed) => (
                <p key={speed}>{speed.toFixed()}</p>
              ))}
            </div>
          </Paper>
        </div>
      </div>
    </>
  )
}
