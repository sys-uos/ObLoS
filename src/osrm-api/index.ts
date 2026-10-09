import type { RouteServiceOptions, RouteServiceResponse, MatchServiceOptions, MatchServiceResponse } from './types'

export default class OSRMApi {
  private readonly api_host: string
  constructor(api_host?: string) {
    this.api_host = api_host ?? 'http://localhost:5000'
  }

  async route_request<OptionsT extends RouteServiceOptions>(
    options: OptionsT
  ): Promise<RouteServiceResponse<OptionsT>> {
    const { version, profile, coordinates, format } = options
    const coordinatesStr = coordinates
      .map(([lon, lat]) => `${lon},${lat}`)
      .join(';')
    const url = new URL(
      `${this.api_host}/route/${version ?? 'v1'}/${profile}/${coordinatesStr}${format ? `.${format}` : ''}`
    )
    for (const key of [
      'alternatives',
      'steps',
      'annotations',
      'geometries',
      'overview',
      'continue_straight',
      'waypoints'
    ] as const) {
      const value = options[key]
      if (value === undefined) continue

      const serialized = Array.isArray(value) ? value.join(';') : `${value}`

      url.searchParams.set(key, serialized)
    }
    console.log('Sending request to OSRM:', url.toString())
    const response = await fetch(url)
    return response.json()
  }

  async match_request<OptionsT extends MatchServiceOptions>(
      options: OptionsT
  ): Promise<MatchServiceResponse<OptionsT>> {
      const { version, profile, coordinates, format } = options
      const coordinatesStr = coordinates
          .map(([lon, lat]) => `${lon},${lat}`)
          .join(';')
      const url = new URL(
          `${this.api_host}/match/${version ?? 'v1'}/${profile}/${coordinatesStr}${format ? `.${format}` : ''}`
      )
      for (const key of [
          'steps',
          'geometries',
          'annotations',
          'overview',
          'timestamps',
          'radiuses',
          'waypoints',
          'gaps'
      ] as const) {
          const value = options[key]
          if (value === undefined) continue

          const serialized = Array.isArray(value) ? value.join(';') : `${value}`

          url.searchParams.set(key, serialized)
      }
      console.log('Sending request to OSRM:', url.toString())
      const response = await fetch(url)
      return response.json()
  }
}
