// https://nominatim.org/release-docs/develop/api/Output/#addressdetails
type Addressdetails = Partial<
  Record<
    | 'continent'
    | 'country'
    | 'country_code'
    | 'region'
    | 'state'
    | 'state_district'
    | 'county'
    | 'ISO3166-2-lvl'
    | 'municipality'
    | 'city'
    | 'town'
    | 'village'
    | 'city_district'
    | 'district'
    | 'borough'
    | 'suburb'
    | 'subdivision'
    | 'hamlet'
    | 'croft'
    | 'isolated_dwelling'
    | 'neighbourhood'
    | 'allotments'
    | 'quarter'
    | 'city_block'
    | 'residential'
    | 'farm'
    | 'farmyard'
    | 'industrial'
    | 'commercial'
    | 'retail'
    | 'road'
    | 'house_number'
    | 'house_name'
    | 'emergency'
    | 'historic'
    | 'military'
    | 'natural'
    | 'landuse'
    | 'place'
    | 'railway'
    | 'man_made'
    | 'aerialway'
    | 'boundary'
    | 'amenity'
    | 'aeroway'
    | 'club'
    | 'craft'
    | 'leisure'
    | 'office'
    | 'mountain_pass'
    | 'shop'
    | 'tourism'
    | 'bridge'
    | 'tunnel'
    | 'waterway'
    | 'postcode',
    string
  >
>

// See https://nominatim.org/release-docs/develop/api/Output/#place-output
interface PlaceOutput<
  HasAddress extends boolean | undefined = false,
  HasExtratags extends boolean | undefined = false,
  HasNamedetails extends boolean | undefined = false
> {
  place_id: number
  licence: string
  osm_type: string
  osm_id: string
  boundingbox: [string, string, string, string]
  lat: string
  lon: string
  display_name: string
  category: string
  type: string
  importance: number
  icon: string
  address: HasAddress extends true ? Addressdetails : undefined
  extratags: HasExtratags extends true ? Partial<Record<string, string>>
  : undefined
  namedetails: HasNamedetails extends true ? Partial<Record<string, string>>
  : undefined
}

type CommonParams = Partial<{
  'addressdetails': boolean
  'extratags': boolean
  'namedetails': boolean
  'accept-language': string | string[]
  'layer': ('address' | 'poi' | 'railway' | 'natural' | 'manmade')[]
  'polygon': 'geojson' | 'kml' | 'svg' | 'text'
  'polygon_threshold': number
  'email': string
  'debug': boolean
}>

type SearchParams = CommonParams &
  Partial<{
    limit: number
    countrycodes: string[]
    featureType: 'country' | 'state' | 'city' | 'settlement'
    exclude_place_ids: number[]
    viewbox: [number, number, number, number]
    bounded: boolean
    dedupe: boolean
  }> &
  (
    | {
        q: string
      }
    | {
        amenity: string
        street: string
        city: string
        county: string
        state: string
        country: string
        postalcode: string
      }
  )

interface ReverseParams extends CommonParams {
  lat: number | string
  lon: number | string
}

export type { PlaceOutput, SearchParams, ReverseParams, CommonParams }
