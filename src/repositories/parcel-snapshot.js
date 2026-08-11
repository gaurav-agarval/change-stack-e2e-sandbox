import { createHash } from "node:crypto"

const snapshotVersion = 2

function checksum(payload) {
  return createHash("sha256").update(payload).digest("hex")
}

function normalizeParcel(parcel) {
  return {
    destination: parcel.destination,
    id: parcel.id,
    status: parcel.status,
    version: parcel.version,
    weightGrams: parcel.weightGrams,
  }
}

export function encodeParcelSnapshot(parcels, createdAt = new Date()) {
  const data = JSON.stringify({
    createdAt: createdAt.toISOString(),
    parcels: parcels.map(normalizeParcel).toSorted((a, b) =>
      a.id.localeCompare(b.id),
    ),
    snapshotVersion,
  })
  return JSON.stringify({ checksum: checksum(data), data })
}

export function decodeParcelSnapshot(serialized) {
  let envelope
  try {
    envelope = JSON.parse(serialized)
  } catch {
    throw new Error("Snapshot envelope is not valid JSON")
  }
  if (!envelope?.data || !envelope?.checksum) {
    throw new Error("Snapshot envelope is incomplete")
  }
  if (checksum(envelope.data) !== envelope.checksum) {
    throw new Error("Snapshot checksum does not match its payload")
  }

  const payload = JSON.parse(envelope.data)
  if (payload.snapshotVersion !== snapshotVersion) {
    throw new Error(`Unsupported snapshot version ${payload.snapshotVersion}`)
  }
  if (!Array.isArray(payload.parcels)) {
    throw new Error("Snapshot parcel collection is missing")
  }
  return Object.freeze({
    createdAt: payload.createdAt,
    parcels: Object.freeze(payload.parcels.map((parcel) => Object.freeze(parcel))),
    snapshotVersion: payload.snapshotVersion,
  })
}
