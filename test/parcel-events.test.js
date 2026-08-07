import assert from "node:assert/strict"
import test from "node:test"
import {
  EventBus,
  InMemoryParcelStore,
  ParcelService,
  ParcelStatus,
} from "../src/index.js"

test("parcel service emits registration and transition events", async () => {
  const bus = new EventBus()
  const events = []
  bus.subscribe("*", (event) => events.push(event))
  const service = new ParcelService(new InMemoryParcelStore(), { eventBus: bus })

  const created = await service.register({
    id: "parcel-events",
    destination: "North Harbor",
    weightGrams: 250,
  })
  await service.transition(created.id, ParcelStatus.IN_TRANSIT)

  assert.deepEqual(
    events.map((event) => event.type),
    ["parcel.registered", "parcel.status_changed"],
  )
  assert.equal(events[1].previousStatus, ParcelStatus.CREATED)
  assert.equal(events[1].currentStatus, ParcelStatus.IN_TRANSIT)
})
