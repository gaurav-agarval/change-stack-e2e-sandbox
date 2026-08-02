import assert from "node:assert/strict"
import test from "node:test"
import {
  AuditLog,
  createRoutePlan,
  InMemoryParcelStore,
  InMemoryRouteStore,
  ParcelController,
  ParcelService,
  RoutingService,
  withAudit,
} from "../src/index.js"

function controllerFixture() {
  const parcelStore = new InMemoryParcelStore()
  const parcelService = new ParcelService(parcelStore)
  const routeStore = new InMemoryRouteStore([
    createRoutePlan({
      id: "route-controller",
      zones: ["CM-04"],
      capacityGrams: 10_000,
    }),
  ])
  const auditLog = new AuditLog()
  const routingService = withAudit(
    new RoutingService({ parcelStore, routeStore }),
    auditLog,
  )
  return {
    auditLog,
    controller: new ParcelController({ parcelService, routingService }),
  }
}

test("registers, previews, and assigns a parcel through controller boundaries", async () => {
  const { auditLog, controller } = controllerFixture()
  const registration = await controller.register({
    body: {
      id: "parcel-api",
      destination: "Central Market",
      weightGrams: 900,
    },
  })
  assert.equal(registration.status, 201)

  const preview = await controller.previewRoutes({
    params: { id: "parcel-api" },
  })
  assert.equal(preview.status, 200)
  assert.equal(preview.body.candidates.length, 1)

  const assignment = await controller.assignRoute({
    params: { id: "parcel-api" },
  })
  assert.equal(assignment.status, 200)
  assert.deepEqual(auditLog.list().map((entry) => entry.action), [
    "route.assigned",
  ])
})

test("maps validation and routing failures to stable response codes", async () => {
  const { auditLog, controller } = controllerFixture()
  const invalid = await controller.register({ body: { id: "broken" } })
  assert.equal(invalid.status, 400)

  const missing = await controller.assignRoute({
    params: { id: "missing" },
  })
  assert.equal(missing.status, 404)
  assert.equal(auditLog.list({ action: "route.rejected" }).length, 1)
})
