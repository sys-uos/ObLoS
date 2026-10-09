import type { LonLatTuple } from './osrm-api/types'

const possibleDataFields = ['longitude', 'latitude', 'timestamp', 'speed', 'radius']
const requiredDataFields = ['longitude', 'latitude'] as const

export class FileUploadHandler {
  public async parseFile(file: File): Promise<{
    coordinates: LonLatTuple[],
    timestamps?: number[]
    speeds?: number[]
    radiuses?: number[]
  }> {
    const availableDataFields = new Array<string>()
    const text = await file.text()
    const json = JSON.parse(text)
    // Check which fields are present
    for (const field of possibleDataFields) {
      if (json[0].hasOwnProperty(field)) {
        availableDataFields.push(field)
      }
    }
    // create a map of field -> array of values to store the data
    let data = new Map<string, Array<number>>()
    for (const field of availableDataFields) {
      data.set(field, [])
    }
    // check if all required fields are present
    for (const field of requiredDataFields) {
      if (!data.has(field)) {
        throw new Error(`File is missing required field ${field}`)
      }
    }
    // fill the map with the data, throw an error if a field is missing
    for (const entry of json) {
      for (const field of availableDataFields) {
        if (!entry.hasOwnProperty(field)) {
          throw new Error(`Entry ${entry} is missing field ${field}`)
        }
        data.get(field)?.push(entry[field])
      }
    }
    // round timestamps to the nearest second, if multiple timestamps round to the nearest second get the average of each field
    if (data.has('timestamp')) {
      data = this.averageByTimestamp(data, availableDataFields)
    }
    const coordinates = data.get('longitude')!.map((lon, i) => [lon, data.get('latitude')![i]!] as LonLatTuple)
    return { coordinates: coordinates, timestamps: data.get('timestamp'), speeds: data.get('speed'), radiuses: data.get('radius') }
  }

  private averageByTimestamp(data: Map<string,number[]>, availableDataFields: string[]): Map<string,number[]> {
    data.set('timestamp',data.get('timestamp')!.map((timestamp) => Math.round(timestamp)))
    const bucketsByTimestamp = new Map<number, Array<number>>()
    // collect all indices of each timestamp
    for (let i = 0; i < data.get('timestamp')!.length; i++) {
      const timestamp = data.get('timestamp')![i]!;
      if (!bucketsByTimestamp.has(timestamp)) {
        bucketsByTimestamp.set(timestamp, [])
      }
      bucketsByTimestamp.get(timestamp)!.push(i)
    }
    // create a map of field -> array of averaged values for each timestamp
    const averagedData = new Map<string, Array<number>>()
    for (const field of availableDataFields) {
      averagedData.set(field, [])
    }
    // write all timestamps to the averaged map
    const arr = averagedData.get('timestamp')!
    for (const timestamp of bucketsByTimestamp.keys()) {
      arr.push(timestamp)
    }
    // calculate the average of each field for each timestamp
    for (const field of availableDataFields) {
      if (field === 'timestamp') { // timestamps are already in the averaged map
      } else {
        const arr = averagedData.get(field)!
        for (const timestamp of averagedData.get('timestamp')!) {
          const indices = bucketsByTimestamp.get(timestamp)!
          arr.push(indices.map(i => data.get(field)![i]!).reduce((a, b) => a + b) / indices.length)
        }
      }
    }
    return averagedData
  }
}