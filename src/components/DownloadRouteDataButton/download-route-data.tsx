import type { ObstacleOnRoute, RouteSegment } from '../../types'

/**
 * Generates and triggers the download of CSV files containing simulated loss trace data
 * for the provided routes.
 * @param routes - A record mapping route names to arrays of segments and obstacles.
 */
export function downloadRouteData(routes: Record<string, [RouteSegment[],ObstacleOnRoute[]]> | undefined){
  // Guard clause: exit if no routes data is provided
  if (!routes) return;

  // Log routes for debugging purposes
  console.log("routes to download:",routes)

  // Iterate through each route entry in the record
  Object.entries(routes).forEach(([routeName, [segments, _]]) => {
    // Map to store loss timestamps (key: timestamp, value: time under obstruction)
    const lossTimestamps: Record<number, number> = {};

    // Process each segment to extract loss time data
    segments.forEach(segment => {
      // Only process segments that have obstruction time
      if (segment.time_under_obstruction){
        // Use trace_delta_time if available, otherwise fall back to duration_along_route
        if (segment.trace_delta_time){
          lossTimestamps[segment.trace_delta_time] = segment.time_under_obstruction;
        } else {
          lossTimestamps[segment.duration_along_route] = segment.time_under_obstruction;
        }
      }
    })

    // Create a Blob containing the CSV data with header and sorted rows
    const blob = new Blob(
      [
        // CSV header row
        `timestamp,lossTime\n`,
        // Convert timestamps to sorted array, filter out zero loss times, and format as CSV rows
        Object.entries(lossTimestamps)
          .filter(([, lossTime]) => lossTime) // Filter out entries with falsy lossTime values
          .toSorted((a, b) => Number(a[0]) - Number(b[0])) // Sort by timestamp numerically
          .map(([timestamp, lossTime]) => `${timestamp},${lossTime}`) // Format each entry as CSV row
          .join('\n') // Join all rows with newlines
      ],
      { type: 'text/csv' }
    )

    // Generate a temporary URL for the Blob
    const href = URL.createObjectURL(blob)
    // Create a temporary anchor element to trigger the download
    const linkElem = document.createElement('a')
    linkElem.href = href
    // Set the download filename based on the route name
    linkElem.download = routeName+'_simulated_loss_trace.csv'
    // Append to DOM, click, and remove to trigger download
    document.body.appendChild(linkElem)
    linkElem.click()
    document.body.removeChild(linkElem)
  })
}