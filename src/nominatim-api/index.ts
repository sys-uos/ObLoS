import type {
  CommonParams,
  PlaceOutput,
  ReverseParams,
  SearchParams
} from './types'

export default class NominatimApi {
  private readonly api_host: string
  constructor(api_host?: string) {
    this.api_host = api_host ?? 'https://nominatim.openstreetmap.org'
  }

  #prepareCommonParams(data: CommonParams): Record<string, string> {
    const params: Record<string, string> = {}
    for (const prop of [
      'addressdetails',
      'extratags',
      'namedetails',
      'accept-language',
      'layer',
      'polygon_threshold',
      'email',
      'debug'
    ] as const) {
      const value = data[prop]
      if (value === undefined) continue
      if (Array.isArray(value)) {
        params[prop] = value.join(',')
      } else {
        params[prop] =
          typeof value !== 'boolean' ? `${value}` : `${Number(value)}`
      }
    }
    if (data['polygon']) {
      params[`polygon_${data['polygon']}`] = '1'
    }

    params['format'] = 'jsonv2'

    return params
  }

  #createRequestUrl(endpoint: string, params: Record<string, string>): URL {
    const url = new URL(`${this.api_host}/${endpoint}`)
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value)
    )
    return url
  }

  async search<Params extends SearchParams>(
    data: Params
  ): Promise<
    Params['debug'] extends true ? string
    : PlaceOutput<
        Params['addressdetails'] extends true ? true : false,
        Params['extratags'] extends true ? true : false,
        Params['namedetails'] extends true ? true : false
      >[]
  > {
    const params = this.#prepareCommonParams(data)

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return
      if (Array.isArray(value)) {
        params[key] = value.join(',')
      } else {
        params[key] =
          typeof value !== 'boolean' ? `${value}` : `${Number(value)}`
      }
    })

    const url = this.#createRequestUrl('search', params)

    const response = await fetch(url)
    return data['debug'] ? ((await response.text()) as never) : response.json()
  }

  async reverse<Params extends ReverseParams>(
    data: Params
  ): Promise<
    Params['debug'] extends true ? string
    : PlaceOutput<
        Params['addressdetails'] extends true ? true : false,
        Params['extratags'] extends true ? true : false,
        Params['namedetails'] extends true ? true : false
      >
  > {
    const params = this.#prepareCommonParams(data)

    params['lat'] = `${data.lat}`
    params['lon'] = `${data.lon}`

    const url = this.#createRequestUrl('reverse', params)

    const response = await fetch(url)
    return data['debug'] ? ((await response.text()) as never) : response.json()
  }
}
