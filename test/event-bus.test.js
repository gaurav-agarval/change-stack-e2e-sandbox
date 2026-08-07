import assert from "node:assert/strict"
import test from "node:test"
import { EventBus, EventDispatchError } from "../src/index.js"

test("publishes to specific and wildcard handlers", async () => {
  const bus = new EventBus()
  const received = []
  bus.subscribe("parcel.registered", (event) => received.push(`specific:${event.id}`))
  bus.subscribe("*", (event) => received.push(`wildcard:${event.id}`))

  const result = await bus.publish({ type: "parcel.registered", id: "one" })
  assert.equal(result.deliveredTo, 2)
  assert.deepEqual(received, ["specific:one", "wildcard:one"])
})

test("collects handler failures without skipping healthy handlers", async () => {
  const bus = new EventBus()
  let healthyHandlerCalled = false
  bus.subscribe("parcel.registered", () => {
    throw new Error("synthetic handler failure")
  })
  bus.subscribe("parcel.registered", () => {
    healthyHandlerCalled = true
  })

  await assert.rejects(
    () => bus.publish({ type: "parcel.registered" }),
    (error) => {
      assert.ok(error instanceof EventDispatchError)
      assert.equal(error.failures.length, 1)
      return true
    },
  )
  assert.equal(healthyHandlerCalled, true)
})
