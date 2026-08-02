export const ParcelStatus = Object.freeze({
  CREATED: "created",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
})

const allowedTransitions = new Map([
  [ParcelStatus.CREATED, new Set([ParcelStatus.IN_TRANSIT])],
  [ParcelStatus.IN_TRANSIT, new Set([ParcelStatus.DELIVERED])],
  [ParcelStatus.DELIVERED, new Set()],
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
  })
}

export function transitionParcel(parcel, nextStatus) {
  if (!allowedTransitions.get(parcel.status)?.has(nextStatus)) {
    throw new Error(`Cannot transition ${parcel.status} to ${nextStatus}`)
  }

  return Object.freeze({
    ...parcel,
    status: nextStatus,
    version: parcel.version + 1,
  })
}
