export const ParcelStatus = Object.freeze({
  CREATED: "created",
  ROUTED: "routed",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
})

const allowedTransitions = new Map([
  [ParcelStatus.CREATED, new Set([ParcelStatus.ROUTED, ParcelStatus.CANCELLED])],
  [ParcelStatus.ROUTED, new Set([ParcelStatus.IN_TRANSIT, ParcelStatus.CANCELLED])],
  [ParcelStatus.IN_TRANSIT, new Set([ParcelStatus.DELIVERED, ParcelStatus.CANCELLED])],
  [ParcelStatus.DELIVERED, new Set()],
  [ParcelStatus.CANCELLED, new Set()],
])

export function createParcel({ id, destination, weightGrams }) {
  if (!id?.trim()) throw new Error("Parcel id is required")
  if (!destination?.trim()) throw new Error("Destination is required")
  if (!Number.isInteger(weightGrams) || weightGrams <= 0) {
    throw new Error("Weight must be a positive integer")
  }

  return Object.freeze({
    id,
    destination,
    weightGrams,
    status: ParcelStatus.CREATED,
    version: 1,
    route: null,
    history: [
      Object.freeze({ status: ParcelStatus.CREATED, reason: "registered" }),
    ],
  })
}

export function transitionParcel(parcel, nextStatus, reason = "status updated") {
  if (!allowedTransitions.get(parcel.status)?.has(nextStatus)) {
    throw new Error(`Cannot transition ${parcel.status} to ${nextStatus}`)
  }

  return Object.freeze({
    ...parcel,
    status: nextStatus,
    version: parcel.version + 1,
    history: [
      ...parcel.history,
      Object.freeze({ status: nextStatus, reason }),
    ],
  })
}

export function assignRoute(parcel, route) {
  if (parcel.status !== ParcelStatus.CREATED) {
    throw new Error("Only newly created parcels can be routed")
  }
  if (!route?.id || !Array.isArray(route.stops) || route.stops.length === 0) {
    throw new Error("A route with at least one stop is required")
  }

  return Object.freeze({
    ...transitionParcel(parcel, ParcelStatus.ROUTED, `assigned ${route.id}`),
    route: Object.freeze({ ...route, stops: Object.freeze([...route.stops]) }),
  })
}
