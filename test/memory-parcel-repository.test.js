import assert from "node:assert/strict"
import test from "node:test"
import {
  createParcel,
  MemoryParcelRepository,
  ParcelStatus,
  transitionParcel,
  VersionConflictError,
} from "../src/index.js"

test("records inserts, updates, and status-filtered queries", async () => {
  const repository = new MemoryParcelRepository()
  const parcel = createParcel({
    id: "parcel-repository",
    destination: "Central Market",
    weightGrams: 300,
  })
  await repository.save(parcel)
  const advanced = transitionParcel(parcel, ParcelStatus.IN_TRANSIT)
  await repository.save(advanced, { expectedVersion: 1 })

  assert.equal((await repository.list({ status: ParcelStatus.CREATED })).length, 0)
  assert.equal(
    (await repository.list({ status: ParcelStatus.IN_TRANSIT })).length,
    1,
  )
  assert.deepEqual(repository.operationLog(), [
    {
      kind: "insert",
      parcelId: parcel.id,
      fromVersion: 0,
      toVersion: 1,
    },
    {
      kind: "update",
      parcelId: parcel.id,
      fromVersion: 1,
      toVersion: 2,
    },
  ])
})

test("rejects stale writes with conflict details", async () => {
  const repository = new MemoryParcelRepository()
  const parcel = createParcel({
    id: "parcel-conflict",
    destination: "West Ridge",
    weightGrams: 450,
  })
  await repository.save(parcel)

  await assert.rejects(
    () => repository.save(parcel, { expectedVersion: 9 }),
    (error) => {
      assert.ok(error instanceof VersionConflictError)
      assert.equal(error.expectedVersion, 9)
      assert.equal(error.actualVersion, 1)
      return true
    },
  )
})
