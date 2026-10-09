import type {
  OverpassCount,
  OverpassNode,
  OverpassWay,
  OverpassWayBody,
} from '../types'
import type { LonLatTuple, OSMID } from '../osrm-api/types'

export class OverpassApiClient {
  private minDelay: number
  private lastRequestTime = 0

  constructor(minDelay: number = 10000) {
    // minDelay in milliseconds; e.g. 1000 = 1 second between requests
    this.minDelay = minDelay
  }

  private async waitForNextRequest() {
    const now = Date.now()
    const elapsed = now - this.lastRequestTime

    if (elapsed < this.minDelay) {
      console.log(`Waiting ${this.minDelay - elapsed} ms for the next request.`)
      await new Promise((resolve) =>
        setTimeout(resolve, this.minDelay - elapsed)
      )
    }

    this.lastRequestTime = Date.now()
  }

  public async getOverpassObstacleData(nodeIDs: OSMID[]) {
    const query = this.getOverpassObstacleQuery(nodeIDs)
    console.log('Obstacle Query', query)

    await this.waitForNextRequest()

    const overpassQueryResponse = await fetch(
      'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query)
      }
    )
      .then((data) => data.json())
      .then(
        ({ elements }) =>
          elements as (OverpassCount | OverpassWay | OverpassWayBody)[]
      )

    const routeWaysCount = Number(
      (overpassQueryResponse[0] as OverpassCount).tags.ways
    )
    const tunnelCount = Number(
      (overpassQueryResponse[routeWaysCount + 1] as OverpassCount).tags.ways
    )
    const ways = overpassQueryResponse.slice(1, routeWaysCount+1) as OverpassWayBody[]
    const obstacles = overpassQueryResponse.slice(
      routeWaysCount + 2
    ) as OverpassWay[]
    const tunnels = obstacles.slice(0, tunnelCount)
    const crossings = obstacles.slice(tunnelCount)
    return { ways,tunnels, crossings }
  }

  public async getOverpassNodeData(
    node_ids: Set<OSMID>
  ): Promise<Map<number, [LonLatTuple, OverpassNode]>> {
    const nodes = await this.getOverpassNodeQueryResponse(node_ids)
    const nodeMap = new Map<number, [LonLatTuple, OverpassNode]>()
    nodes.forEach((node) => nodeMap.set(node.id, [[node.lon, node.lat], node]))
    return nodeMap
  }

  private async getOverpassNodeQueryResponse(
    node_ids: Set<OSMID>
  ): Promise<OverpassNode[]> {
    const query = this.getOverpassNodeQuery(node_ids)
    console.log('Node Query', query)

    await this.waitForNextRequest()

    return await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query)
    })
      .then((data) => data.json())
      .then(({ elements }) => elements as OverpassNode[])
  }

  private getOverpassNodeQuery(node_ids: Set<OSMID>): string {
    const nodestring = [...node_ids].join(',')
    return `
[out:json][timeout: 30];
node(id:${nodestring});
out geom;`
  }

  private getOverpassObstacleQuery(nodeIDs: OSMID[]) {
    const even: number[] = [],
      odd: number[] = []
    nodeIDs.forEach((v, i) => (i % 2 ? odd : even).push(v))
    return `
[out:json][timeout: 500];
node(id: ${even});
way(bn)[highway][highway!=path][highway!=footway][highway!=cycleway][highway!=track][highway!=steps]->.route_a;
._ -> .nodes_a;
node(id: ${odd});
way(bn)[highway][highway!=path][highway!=footway][highway!=cycleway][highway!=track][highway!=steps]->.route_b;
._ -> .nodes_b;
(.nodes_a; .nodes_b;)->._;
way(bn)->.adjacent;

way.route_a.route_b->.route;
.route out count;
.route out body;

way.route[tunnel]->.tunnels;
.tunnels out count;
.tunnels out geom;
   
(.route; - way.route[man_made="bridge"];)->.route;
way(around.route:0)[bridge][man_made!="bridge"]->.bridges;
(.bridges; - .adjacent;)->.crossing;
.crossing out ids geom;`
  }
}