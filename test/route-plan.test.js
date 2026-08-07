import assert from "node:assert/strict"
import test from "node:test"
import {
  allocateParcel,
  createParcel,
  createRoutePlan,
} from "../src/index.js"

test("allocates parcels while preserving route capacity", () => {
  const route = createRoutePlan({
    id: "route-blue",
    zones: ["NH-01", "NH-02", "NH-01"],
    capacityGrams: 2_000,
  })
  const parcel = createParcel({
    id: "parcel-303",
    destination: "North Harbor",
    weightGrams: 650,
  })

  const allocated = allocateParcel(route, parcel)
  assert.equal(allocated.allocatedGrams, 650)
  assert.deepEqual(allocated.parcelIds, [parcel.id])
  assert.deepEqual(allocated.zones, ["NH-01", "NH-02"])
})

test("rejects invalid zones and capacity overflow", () => {
  assert.throws(
    () => createRoutePlan({ id: "bad", zones: ["north"], capacityGrams: 1 }),
    /AA-00/,
  )

  const route = createRoutePlan({
    id: "route-small",
    zones: ["WR-09"],
    capacityGrams: 100,
  })
  const parcel = createParcel({
    id: "parcel-heavy",
    destination: "West Ridge",
    weightGrams: 101,
  })
  assert.throws(() => allocateParcel(route, parcel), /capacity/)
})
