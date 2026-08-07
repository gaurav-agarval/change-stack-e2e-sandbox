import { assignRoute } from "../domain/parcel.js"
import { allocateParcel } from "../domain/route-plan.js"
import { rankRoutes } from "../policies/zone-policy.js"

export class RoutingService {
  constructor({ parcelStore, routeStore }) {
    this.parcelStore = parcelStore
    this.routeStore = routeStore
  }

  async assignBestRoute(parcelId) {
    const parcel = await this.parcelStore.get(parcelId)
    if (!parcel) throw new Error(`Parcel ${parcelId} was not found`)

    const candidates = rankRoutes(await this.routeStore.list(), parcel)
    const selected = candidates[0]
    if (!selected) {
      throw new Error(`No route is available for ${parcel.destination}`)
    }

    const updatedRoute = allocateParcel(selected, parcel)
    const updatedParcel = assignRoute(parcel, {
      id: selected.id,
      stops: selected.zones,
    })

    await this.routeStore.save(updatedRoute)
    await this.parcelStore.save(updatedParcel)
    return { parcel: updatedParcel, route: updatedRoute }
  }

  async preview(parcelId) {
    const parcel = await this.parcelStore.get(parcelId)
    if (!parcel) throw new Error(`Parcel ${parcelId} was not found`)
    return rankRoutes(await this.routeStore.list(), parcel).map((route) => ({
      id: route.id,
      remainingCapacityGrams:
        route.capacityGrams - route.allocatedGrams - parcel.weightGrams,
      zones: route.zones,
    }))
  }
}
