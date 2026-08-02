const destinationZones = new Map([
  ["North Harbor", ["NH-01", "NH-02"]],
  ["West Ridge", ["WR-09"]],
  ["Central Market", ["CM-04", "CM-05"]],
])

export function zonesForDestination(destination) {
  return destinationZones.get(destination) ?? []
}

export function routeSupportsDestination(route, destination) {
  const acceptedZones = new Set(zonesForDestination(destination))
  return route.zones.some((zone) => acceptedZones.has(zone))
}

export function rankRoutes(routes, parcel) {
  return routes
    .filter((route) => routeSupportsDestination(route, parcel.destination))
    .filter(
      (route) =>
        route.allocatedGrams + parcel.weightGrams <= route.capacityGrams,
    )
    .toSorted((left, right) => {
      const leftRemaining = left.capacityGrams - left.allocatedGrams
      const rightRemaining = right.capacityGrams - right.allocatedGrams
      return leftRemaining - rightRemaining || left.id.localeCompare(right.id)
    })
}
