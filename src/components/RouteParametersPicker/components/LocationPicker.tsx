import React, { useCallback, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import NominatimApi from '../../../nominatim-api'
import type { PlaceOutput } from '../../../nominatim-api/types'

/**
 * Props for the LocationPicker component.
 */
interface Props {
  /**
   * Reference to the input element, used for focus management.
   */
  ref: React.RefObject<HTMLDivElement | null>
  /**
   * Label text displayed above the input field.
   */
  label: string
  /**
   * Callback function invoked when the selected location changes.
   * Passes coordinates as [longitude, latitude] or null if cleared.
   */
  onLocationUpdate: (newCoordinates: [number, number] | null) => void
}

/**
 * Regular expression to match coordinate input in "lat,lon" format.
 */
const COORDS_REGEX = /(\d+(?:.\d+)?),\s*(\d+(?:.\d+)?)/

/**
 * Singleton instance of the Nominatim API client.
 */
const nominatimApi = new NominatimApi()

/**
 * A component that allows users to search for locations or input coordinates
 * to set a starting/ending point for route planning.
 */
function LocationPicker({ ref, label, onLocationUpdate }: Props) {
  // State for storing the currently selected location
  const [selectedLocation, setSelectedLocation] = useState<PlaceOutput | null>(
    null
  )
  // State for storing search results from the Nominatim API
  const [searchResults, setSearchResults] = useState<PlaceOutput[]>([])

  /**
   * Handles location input by parsing coordinates or triggering a geocoding search.
   * @param coordsOrLocationName - Can be null, a PlaceOutput object, or a string (coordinates or search query)
   */
  const setCoordinatesOrSearchForLocation = useCallback(
    async (coordsOrLocationName: string | PlaceOutput | null) => {
      // Handle null/empty input by clearing the location
      if (!coordsOrLocationName) {
        onLocationUpdate(null)
        setSearchResults([])
        return
      }

      if (typeof coordsOrLocationName === 'object') {
        // Case 1: User selected a location from search results
        onLocationUpdate([
          Number(coordsOrLocationName.lat),
          Number(coordsOrLocationName.lon)
        ])
        setSelectedLocation(coordsOrLocationName)
        return
      }
      // Try to match coordinate input pattern
      const match = coordsOrLocationName.match(COORDS_REGEX)

      if (match) {
        // Case 2: User input coordinates ("lat,lon")
        const [, lat, lon] = match
        if (!lat || !lon) return
        onLocationUpdate([Number(lat), Number(lon)])
        // Perform reverse geocoding to get a display name for the coordinates
        const reverseResponse = await nominatimApi.reverse({ lat, lon })
        setSearchResults([reverseResponse])
        setSelectedLocation(reverseResponse)
      } else {
        // Case 3: User wants to search for a location by name
        const response = await nominatimApi.search({
          q: coordsOrLocationName
        })

        setSearchResults(
          // Deduplicate results based on display_name
          response.reduce(
            (results: PlaceOutput[], newResult) =>
              (
                results.find(
                  (result) => result.display_name === newResult.display_name
                )
              ) ?
                results
                : [...results, newResult],
            []
          )
        )
      }
    },
    [setSearchResults]
  )

  return (
    <Autocomplete
      value={selectedLocation}
      renderInput={(params) => (
        <TextField
          ref={ref}
          label={label}
          helperText='Insert coordinates or search for a location'
          {...params}
        />
      )}
      options={searchResults}
      getOptionLabel={(option) => option.display_name}
      includeInputInList
      filterSelectedOptions
      noOptionsText='Hit Enter to search for given input'
      // Update location when selection changes
      onChange={(_, value) => setCoordinatesOrSearchForLocation(value)}
      // Handle Enter key press to trigger search or coordinate parsing
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const value = (e.target as any).value
          void setCoordinatesOrSearchForLocation(value)
          e.preventDefault()
        }
      }}
    />
  )
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default React.memo(LocationPicker)