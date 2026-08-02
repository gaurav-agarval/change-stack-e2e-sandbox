const zonePattern = /^[A-Z]{2}-\d{2}$/

export function createRoutePlan({ id, zones, capacityGrams }) {
  if (!id?.trim()) throw new Error("Route id is required")
  if (!Array.isArray(zones) || zones.length === 0) {
    throw new Error("At least one zone is required")
  }
  if (zones.some((zone) => !zonePattern.test(zone))) {
    throw new Error("Zones must use the AA-00 format")
  }
  if (!Number.isInteger(capacityGrams) || capacityGrams <= 0) {
    throw new Error("Route capacity must be a positive integer")
  }

  return Object.freeze({
    id,
    zones: Object.freeze([...new Set(zones)]),
    capacityGrams,
    allocatedGrams: 0,
    parcelIds: Object.freeze([]),
  })
}

export function allocateParcel(route, parcel) {
  const nextWeight = route.allocatedGrams + parcel.weightGrams
  if (nextWeight > route.capacityGrams) {
    throw new Error(`Route ${route.id} capacity would be exceeded`)
  }

  return Object.freeze({
    ...route,
    allocatedGrams: nextWeight,
    parcelIds: Object.freeze([...route.parcelIds, parcel.id]),
  })
}
