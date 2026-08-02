import assert from "node:assert/strict"
import test from "node:test"
import {
  createRetryPolicy,
  MemoryNotificationTransport,
  NotificationMetrics,
  NotificationService,
  StaticPreferences,
} from "../src/index.js"

const event = Object.freeze({
  type: "parcel.status_changed",
  parcelId: "parcel-notify",
  destination: "Central Market",
  previousStatus: "created",
  currentStatus: "in_transit",
  version: 2,
})

function serviceFixture(overrides = {}) {
  const metrics = new NotificationMetrics()
  const email = new MemoryNotificationTransport()
  const preferences = new StaticPreferences({
    [event.parcelId]: [
      { channel: "email", recipient: "reader@example.test", locale: "full" },
      { channel: "signal", recipient: "device-7", locale: "compact" },
    ],
  })
  return {
    email,
    metrics,
    service: new NotificationService({
      preferences,
      transports: { email },
      metrics,
      retryPolicy: createRetryPolicy({ maxAttempts: 3, baseDelayMs: 1 }),
      sleep: async () => {},
      ...overrides,
    }),
  }
}

test("sends supported preferences and reports unsupported channels", async () => {
  const { email, metrics, service } = serviceFixture()
  const result = await service.handle(event)

  assert.deepEqual(
    result.outcomes.map(({ channel, status }) => ({ channel, status })),
    [
      { channel: "email", status: "sent" },
      { channel: "signal", status: "unsupported" },
    ],
  )
  assert.equal(email.messages().length, 1)
  assert.deepEqual(metrics.snapshot(), {
    "notification.sent{channel=email}": 1,
    "notification.unsupported{channel=signal}": 1,
  })
})

test("deduplicates repeated status events", async () => {
  const { email, service } = serviceFixture()
  await service.handle(event)
  const repeated = await service.handle(event)

  assert.equal(repeated.outcomes[0].status, "duplicate")
  assert.equal(email.messages().length, 1)
})

test("retries transient failures and records terminal failures", async () => {
  let attempts = 0
  const flaky = {
    async send() {
      attempts += 1
      const error = new Error("temporary transport interruption")
      error.retryable = true
      throw error
    },
  }
  const { metrics, service } = serviceFixture({ transports: { email: flaky } })
  const result = await service.handle(event)

  assert.equal(attempts, 3)
  assert.equal(result.outcomes[0].status, "failed")
  assert.equal(metrics.snapshot()["notification.failed{channel=email}"], 1)
})
