import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  OutlinedInput,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import L from 'leaflet'
import { LayerGroup, LayersControl, Marker, Popup, useMap } from 'react-leaflet'

import LocationPicker from './components/LocationPicker'
import { FileUploadHandler } from '../../file-upload-handler'
import type { LonLatTuple } from '../../osrm-api/types'

/**
 * Props for the RouteParametersPicker component.
 */
interface Props {
  /**
   * Callback to add a route using the OSRM routing API.
   * @param startCoords - Starting coordinates [lon, lat]
   * @param endCoords - Ending coordinates [lon, lat]
   * @param routeName - Name to identify the route
   */
  addRouteFromRoutingApi: (
    startCoords: LonLatTuple,
    endCoords: LonLatTuple,
    routeName: string
  ) => Promise<void>
  /**
   * Callback to add a route using the OSRM matching API (for GPS traces).
   * @param coordinates - Array of GPS coordinates [lon, lat]
   * @param routeName - Name to identify the route
   * @param timestamps - Optional array of timestamps
   * @param radiuses - Optional array of radius values for matching
   * @param speeds - Optional array of speed values
   */
  addRouteFromMatchingApi: (
    coordinates: LonLatTuple[],
    routeName: string,
    timestamps?: number[],
    radiuses?: number[],
    speeds?: number[]
  ) => Promise<void>
  /**
   * Callback to update the maximum speed setting.
   */
  setMaxSpeed: (maxSpeed: number) => unknown
  /**
   * Optional text to display while loading is in progress.
   */
  loadingText?: string
  /**
   * Callback to set the default download route data flag.
   */
  setDefaultDownloadRouteData: (defaultDownloadRouteData: boolean) => unknown
  /**
   * Whether to download route data by default instead of displaying it.
   */
  defaultDownloadRouteData: boolean
}

/**
 * A component that provides a UI for selecting route start/end points,
 * setting speed parameters, and uploading GPS trace files.
 */
function RouteParametersPicker({
                                 addRouteFromRoutingApi,
                                 addRouteFromMatchingApi,
                                 setMaxSpeed,
                                 loadingText,
                                 setDefaultDownloadRouteData,
                                 defaultDownloadRouteData,
                               }: Props) {
  // State for storing start point coordinates
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  // State for storing end point coordinates
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null)
  // State for storing the maximum speed value (in km/h)
  const [maxSpeed, setMaxSpeedTemp] = useState(130)

  // Instance of the file upload handler for parsing trace files
  const fileUploadHandler = new FileUploadHandler()
  // Refs for DOM elements to prevent Leaflet click propagation
  const startRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const maxSpeedRef = useRef<HTMLDivElement>(null)

  // Access the Leaflet map instance
  const map = useMap()

  // Ref for the hidden file input element
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  // State to track if files are currently being uploaded/processed
  const [uploading, setUploading] = useState(false)

  /**
   * Triggers the hidden file input to open the file selection dialog.
   */
  const pickFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /**
   * Handles the upload and processing of GPS trace files.
   * Parses each file and adds routes using the matching API.
   */
  const handleMatchUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      try {
        // Process each uploaded file
        for (let i = 0; i < files.length; i++) {
          console.log("processing file "+ (i+1) + " of " + files.length + ": " + files.item(i)?.name)
          const file = files.item(i);
          if (!file) continue;
          try {
            // Parse the file data
            const data = await fileUploadHandler.parseFile(file);
            console.log("file data:",data)
            // Add the route using the matching API with parsed data
            await addRouteFromMatchingApi(data.coordinates, file.name.replace(".json",""), data.timestamps, data.radiuses, data.speeds)
          } catch (err) {
            console.error('Failed to process match upload:', err);
            alert(`Failed to process file ${file.name}:\n${(err as Error).message}`);
          }
        }
      } finally {
        setUploading(false);
        // Reset the file input value to allow re-selecting the same file
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    []
  );

  /**
   * Updates the map view when start or end points change.
   * Fits bounds to show both points, or pans to the single available point.
   */
  useEffect(() => {
    if (startPoint && endPoint) {
      // Fit map bounds to show both start and end points
      map.fitBounds(L.latLngBounds(startPoint, endPoint))
    } else {
      // Pan to the single available point if only one exists
      const pointToFocusOn = startPoint ?? endPoint
      if (!pointToFocusOn) return
      map.panTo(pointToFocusOn)
    }
  }, [startPoint, endPoint])

  /**
   * Disables Leaflet click propagation on input elements to prevent
   * map interactions when clicking on the controls.
   */
  useEffect(() => {
    if (startRef.current) L.DomEvent.disableClickPropagation(startRef.current)
    if (endRef.current) L.DomEvent.disableClickPropagation(endRef.current)
    if (maxSpeedRef.current)
      L.DomEvent.disableClickPropagation(maxSpeedRef.current)
  }, [startRef.current, endRef.current, maxSpeedRef.current])

  return (
    <>
      {/* Control panel positioned at top-left of the map */}
      <div className='leaflet-top leaflet-left'>
        <Paper
          className='leaflet-control leaflet-bar'
          sx={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          {/* Start location input */}
          <LocationPicker
            ref={startRef}
            label='Start location'
            onLocationUpdate={setStartPoint}
          />
          {/* End location input */}
          <LocationPicker
            ref={endRef}
            label='End location'
            onLocationUpdate={setEndPoint}
          />
          {/* Button to compute route using OSRM routing API */}
          <Button
            loading={!!loadingText}
            color='success'
            disabled={!startPoint || !endPoint}
            loadingPosition='start'
            onClick={() => {
              if (!startPoint || !endPoint) return
              // Convert from [lat, lon] to [lon, lat] for OSRM API
              addRouteFromRoutingApi(startPoint.toReversed() as LonLatTuple, endPoint.toReversed() as LonLatTuple, startPoint.toString() + " -> " + endPoint.toString())
            }}
          >
            {loadingText ?? 'Compute route'}
          </Button>
          {/* Maximum speed control */}
          <FormControl>
            <Box marginTop={3} display='flex' flexDirection='column'>
              <Typography id='max-speed-slider'>Max speed:</Typography>
              <OutlinedInput
                type='number'
                ref={maxSpeedRef}
                aria-labelledby='max-speed-slider'
                defaultValue={130}
                endAdornment={
                  <InputAdornment position='end'>km/h</InputAdornment>
                }
                onChange={(e) => setMaxSpeedTemp(Number(e.target.value))}
              />
            </Box>
            <Button color='success' onClick={() => setMaxSpeed(maxSpeed)}>
              Update speed limit
            </Button>
          </FormControl>

          {/* Button to upload GPS trace files */}
          <Button
            loading={!!loadingText}
            color='success'
            disabled={uploading}
            loadingPosition='start'
            onClick={() => {
              pickFile()
            }}
          >
            {uploading ? 'Processing…' : 'Upload route JSON'}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              multiple
              onChange={handleMatchUpload}
              style={{ display: 'none' }}
            />
          </Button>

          {/* Checkbox to toggle default data download behavior */}
          <FormControl component={Box} marginTop={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={defaultDownloadRouteData}
                  onChange={(e) => setDefaultDownloadRouteData(e.target.checked)}
                />
              }
              label="Download data instead of displaying it"
            />
          </FormControl>
        </Paper>
      </div>
      {/* Overlay layer showing start/end markers on the map */}
      <LayersControl.Overlay checked name='Start/End markers'>
        <LayerGroup>
          {startPoint && (
            <Marker position={startPoint}>
              <Popup>Start point</Popup>
            </Marker>
          )}
          {endPoint && (
            <Marker position={endPoint}>
              <Popup>End point</Popup>
            </Marker>
          )}
        </LayerGroup>
      </LayersControl.Overlay>
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default React.memo(RouteParametersPicker)