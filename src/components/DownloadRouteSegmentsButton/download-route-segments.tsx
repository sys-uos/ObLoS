import type { ObstacleOnRoute, RouteSegment } from '../../types'

/**
 * Generates and triggers the download of CSV files containing route segment data
 * for the provided routes.
 * @param routes - A record mapping route names to arrays of segments and obstacles.
 */
export function downloadRouteSegments(routes: Record<string, [RouteSegment[],ObstacleOnRoute[]]> | undefined){
  // Guard clause: exit if no routes data is provided
  if (!routes) return;

  // Log routes for debugging purposes
  console.log("routes to download:",routes)

  // Iterate through each route entry in the record
  Object.entries(routes).forEach(([routeName, [segments, _]]) => {
    // Skip if there are no segments for this route
    if (segments.length === 0) return;

    // Get headers from the keys of the first segment object
    const headers = Object.keys(segments[0]!);

    // Array to store CSV rows as strings
    const csvRows: string[] = [];

    // Add header row to CSV
    csvRows.push(headers.join(","));

    // Process each segment to create data rows
    for (const segment of segments) {
      const values = headers.map(header => {
        const val = segment[header];
        // Handle undefined/null values by returning empty string
        if (val === undefined || val === null) return "";
        // Handle arrays (e.g., LonLatTuple) by joining with semicolons and wrapping in quotes
        if (Array.isArray(val)) return `"${val.join(";")}"`;
        // Handle strings with potential commas or quotes by escaping and wrapping in quotes
        if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
        // Convert other types to string
        return String(val);
      });
      // Add the formatted row to CSV rows
      csvRows.push(values.join(","));
    }

    // Join all CSV rows with newlines
    const csvString = csvRows.join("\n");

    // Create a Blob containing the CSV data
    const blob = new Blob([csvString], { type: 'text/csv' });

    // Generate a temporary URL for the Blob
    const href = URL.createObjectURL(blob)
    // Create a temporary anchor element to trigger the download
    const linkElem = document.createElement('a')
    linkElem.href = href
    // Set the download filename based on the route name
    linkElem.download = routeName+'_simulated_segments.csv'
    // Append to DOM, click, and remove to trigger download
    document.body.appendChild(linkElem)
    linkElem.click()
    document.body.removeChild(linkElem)
  })
}