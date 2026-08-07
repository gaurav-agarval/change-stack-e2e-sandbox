import assert from "node:assert/strict"
import test from "node:test"
import {
  InMemoryParcelStore,
  ParcelService,
  ParcelStatus,
} from "../src/index.js"

test("registers and advances a parcel through its lifecycle", async () => {
  const service = new ParcelService(new InMemoryParcelStore())
  const created = await service.register({
    id: "parcel-101",
    destination: "North Harbor",
    weightGrams: 750,
  })

  assert.equal(created.status, ParcelStatus.CREATED)
  await service.transition(created.id, ParcelStatus.ROUTED)
  const inTransit = await service.transition(
    created.id,
    ParcelStatus.IN_TRANSIT,
  )
  const delivered = await service.transition(
    created.id,
    ParcelStatus.DELIVERED,
  )

  assert.equal(inTransit.version, 3)
  assert.equal(delivered.status, ParcelStatus.DELIVERED)
  assert.deepEqual(
    delivered.history.map((entry) => entry.status),
    [
      ParcelStatus.CREATED,
      ParcelStatus.ROUTED,
      ParcelStatus.IN_TRANSIT,
      ParcelStatus.DELIVERED,
    ],
  )
})

test("rejects duplicate parcel identifiers", async () => {
  const service = new ParcelService(new InMemoryParcelStore())
  const input = {
    id: "parcel-202",
    destination: "West Ridge",
    weightGrams: 1250,
  }

  await service.register(input)
  await assert.rejects(() => service.register(input), /already exists/)
})
