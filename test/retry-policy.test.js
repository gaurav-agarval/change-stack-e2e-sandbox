import assert from "node:assert/strict"
import test from "node:test"
import { createRetryPolicy, executeWithRetry } from "../src/index.js"

test("uses bounded exponential backoff for retryable failures", async () => {
  const delays = []
  let attempts = 0
  const result = await executeWithRetry(
    async () => {
      attempts += 1
      if (attempts < 3) {
        const error = new Error("retry me")
        error.retryable = true
        throw error
      }
      return "delivered"
    },
    createRetryPolicy({ maxAttempts: 4, baseDelayMs: 10 }),
    async (delay) => delays.push(delay),
  )

  assert.deepEqual(result, { attempt: 3, value: "delivered" })
  assert.deepEqual(delays, [10, 20])
})

test("does not retry permanent failures", async () => {
  let attempts = 0
  await assert.rejects(
    () =>
      executeWithRetry(
        async () => {
          attempts += 1
          throw new Error("permanent")
        },
        createRetryPolicy({ maxAttempts: 5 }),
      ),
    /permanent/,
  )
  assert.equal(attempts, 1)
})
