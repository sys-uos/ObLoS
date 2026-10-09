import type { ObstacleOnRoute, RouteSegment } from '../../types'

/**
 * Escapes a value for safe inclusion in a CSV file.
 * Handles null/undefined by returning an empty string.
 * Wraps the string in double quotes and escapes internal double quotes.
 */
function csvEscape(value: string | null | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // Escape inner double quotes by doubling them, then wrap in double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates and triggers the download of CSV files containing obstacle data
 * for the provided routes.
 * @param routes - A record mapping route names to arrays of segments and obstacles.
 */
export function downloadObstacleData(routes: Record<string, [RouteSegment[],ObstacleOnRoute[]]> | undefined){
  // Guard clause: exit if no routes data is provided
  if (!routes) return;

  // Iterate through each route entry in the record
  Object.entries(routes).forEach(([routeName,[ _, obstaclesOnRoute]]) => {

    // Filter obstacles to only include those assigned to at least one route segment
    const obstacles: ObstacleOnRoute[] = obstaclesOnRoute.filter(obst => obst.segmentIndices.length > 0)

    // Define the column headers for the CSV output
    const headers = [
      'obstacle_id',
      'obstacle_type',
      'bounds_minlat',
      'bounds_minlon',
      'bounds_maxlat',
      'bounds_maxlon',
      'osm_name',
      'bast_name',
      'est_width',
      'nn_width',
      'osm_width',
      'bast_width',
      'bwnr_tbwnr',
      'geometry_wkt'
    ];

    // Map each obstacle to a CSV row string
    const rows = obstacles.map(obst => {
      const { obstacle, osm_name, bast_name, est_width, nn_width, osm_width, bast_width, bwnr_tbwnr } = obst;

      // WKT encoding, commonly used for line geometry
      // Construct a LINESTRING using longitude and latitude coordinates
      const wkt = `LINESTRING(${
        obstacle.geometry
          .map(pt => `${pt.lon} ${pt.lat}`) // WKT uses lon lat order
          .join(',')
      })`;

      // Create the CSV row by joining escaped values with commas
      return [
        obstacle.id,
        obstacle.type,
        obstacle.bounds.minlat,
        obstacle.bounds.minlon,
        obstacle.bounds.maxlat,
        obstacle.bounds.maxlon,
        csvEscape(osm_name),
        csvEscape(bast_name),
        est_width ?? '',
        nn_width ?? '',
        osm_width ?? '',
        bast_width ?? '',
        csvEscape(bwnr_tbwnr),
        csvEscape(wkt)
      ].join(',');
    });

    // Combine headers and rows into a single CSV string
    const csv = [headers.join(','), ...rows].join('\n');

    // Create a Blob containing the CSV data
    const blob = new Blob([csv], { type: 'text/csv' });
    // Generate a temporary URL for the Blob
    const href = URL.createObjectURL(blob)
    // Create a temporary anchor element to trigger the download
    const linkElem = document.createElement('a')
    linkElem.href = href
    // Set the download filename based on the route name
    linkElem.download = routeName+'_ObstacleData.csv'
    // Append to DOM, click, and remove to trigger download
    document.body.appendChild(linkElem)
    linkElem.click()
    document.body.removeChild(linkElem)
  })
}