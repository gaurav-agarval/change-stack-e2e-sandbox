import assert from "node:assert/strict"
import test from "node:test"
import {
  createParcel,
  createRoutePlan,
  InMemoryParcelStore,
  InMemoryRouteStore,
  ParcelStatus,
  RoutingService,
} from "../src/index.js"

function createFixture() {
  const parcel = createParcel({
    id: "parcel-route-me",
    destination: "North Harbor",
    weightGrams: 400,
  })
  const parcelStore = new InMemoryParcelStore()
  const routeStore = new InMemoryRouteStore([
    createRoutePlan({
      id: "route-roomy",
      zones: ["NH-01"],
      capacityGrams: 5_000,
    }),
    createRoutePlan({
      id: "route-snug",
      zones: ["NH-02"],
      capacityGrams: 700,
    }),
    createRoutePlan({
      id: "route-elsewhere",
      zones: ["WR-09"],
      capacityGrams: 500,
    }),
  ])
  return { parcel, parcelStore, routeStore }
}

test("selects the compatible route with the tightest remaining capacity", async () => {
  const { parcel, parcelStore, routeStore } = createFixture()
  await parcelStore.save(parcel)
  const service = new RoutingService({ parcelStore, routeStore })

  const preview = await service.preview(parcel.id)
  assert.deepEqual(
    preview.map((candidate) => candidate.id),
    ["route-snug", "route-roomy"],
  )

  const result = await service.assignBestRoute(parcel.id)
  assert.equal(result.parcel.status, ParcelStatus.ROUTED)
  assert.equal(result.parcel.route.id, "route-snug")
  assert.deepEqual(result.route.parcelIds, [parcel.id])
})

test("reports when no route serves the destination", async () => {
  const { parcelStore, routeStore } = createFixture()
  const parcel = createParcel({
    id: "parcel-unknown-zone",
    destination: "South Point",
    weightGrams: 200,
  })
  await parcelStore.save(parcel)
  const service = new RoutingService({ parcelStore, routeStore })

  await assert.rejects(
    () => service.assignBestRoute(parcel.id),
    /No route is available/,
  )
})
