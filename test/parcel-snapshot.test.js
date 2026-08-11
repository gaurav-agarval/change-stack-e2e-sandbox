import assert from "node:assert/strict"
import test from "node:test"
import {
  createParcel,
  decodeParcelSnapshot,
  encodeParcelSnapshot,
  MemoryParcelRepository,
} from "../src/index.js"

const fixedTime = new Date("2030-01-02T03:04:05.000Z")

function parcel(id, destination) {
  return createParcel({ id, destination, weightGrams: 500 })
}

test("encodes deterministic, sorted, checksummed snapshots", () => {
  const encoded = encodeParcelSnapshot(
    [parcel("parcel-z", "West Ridge"), parcel("parcel-a", "North Harbor")],
    fixedTime,
  )
  const decoded = decodeParcelSnapshot(encoded)

  assert.equal(decoded.createdAt, fixedTime.toISOString())
  assert.deepEqual(
    decoded.parcels.map((entry) => entry.id),
    ["parcel-a", "parcel-z"],
  )
})

test("detects payload tampering before parsing the snapshot", () => {
  const encoded = encodeParcelSnapshot(
    [parcel("parcel-safe", "Central Market")],
    fixedTime,
  )
  const tampered = encoded.replace("Central Market", "Unknown Market")
  assert.throws(() => decodeParcelSnapshot(tampered), /checksum/)
})

test("restores into an empty repository and protects populated state", async () => {
  const source = new MemoryParcelRepository()
  await source.save(parcel("parcel-backup", "North Harbor"))
  const encoded = source.exportSnapshot(fixedTime)

  const target = new MemoryParcelRepository()
  const snapshot = target.restoreSnapshot(encoded)
  assert.equal(snapshot.snapshotVersion, 2)
  assert.equal((await target.get("parcel-backup")).destination, "North Harbor")

  assert.throws(() => target.restoreSnapshot(encoded), /non-empty/)
  target.restoreSnapshot(encoded, { replace: true })
  assert.equal((await target.list()).length, 1)
})
