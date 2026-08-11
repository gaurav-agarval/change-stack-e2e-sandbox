export class VersionConflictError extends Error {
  constructor(id, expected, actual) {
    super(`Parcel ${id} expected version ${expected}, found ${actual}`)
    this.name = "VersionConflictError"
    this.parcelId = id
    this.expectedVersion = expected
    this.actualVersion = actual
  }
}

export class MemoryParcelRepository {
  #parcels = new Map()
  #operations = []

  async get(id) {
    return this.#parcels.get(id) ?? null
  }

  async save(parcel, { expectedVersion } = {}) {
    const current = this.#parcels.get(parcel.id)
    if (
      expectedVersion !== undefined &&
      (current?.version ?? 0) !== expectedVersion
    ) {
      throw new VersionConflictError(
        parcel.id,
        expectedVersion,
        current?.version ?? 0,
      )
    }

    this.#parcels.set(parcel.id, parcel)
    this.#operations.push(
      Object.freeze({
        kind: current ? "update" : "insert",
        parcelId: parcel.id,
        fromVersion: current?.version ?? 0,
        toVersion: parcel.version,
      }),
    )
    return parcel
  }

  async list({ status } = {}) {
    const parcels = [...this.#parcels.values()]
    return status
      ? parcels.filter((parcel) => parcel.status === status)
      : parcels
  }

  operationLog() {
    return [...this.#operations]
  }

  exportSnapshot(createdAt) {
    return encodeParcelSnapshot([...this.#parcels.values()], createdAt)
  }

  restoreSnapshot(serialized, { replace = false } = {}) {
    const snapshot = decodeParcelSnapshot(serialized)
    if (!replace && this.#parcels.size > 0) {
      throw new Error("Cannot restore over a non-empty repository")
    }

    const next = new Map(snapshot.parcels.map((parcel) => [parcel.id, parcel]))
    this.#parcels = next
    this.#operations.push(
      Object.freeze({
        kind: "restore",
        parcelId: "*",
        fromVersion: 0,
        toVersion: snapshot.snapshotVersion,
      }),
    )
    return snapshot
  }
}
import {
  decodeParcelSnapshot,
  encodeParcelSnapshot,
} from "./parcel-snapshot.js"
