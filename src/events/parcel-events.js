export function parcelRegistered(parcel, occurredAt = new Date()) {
  return Object.freeze({
    type: "parcel.registered",
    occurredAt: occurredAt.toISOString(),
    parcelId: parcel.id,
    destination: parcel.destination,
  })
}

export function parcelStatusChanged(
  previous,
  current,
  occurredAt = new Date(),
) {
  return Object.freeze({
    type: "parcel.status_changed",
    occurredAt: occurredAt.toISOString(),
    parcelId: current.id,
    destination: current.destination,
    previousStatus: previous.status,
    currentStatus: current.status,
    version: current.version,
  })
}
