export function createRetryPolicy({ maxAttempts = 3, baseDelayMs = 25 } = {}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error("maxAttempts must be a positive integer")
  }
  if (!Number.isInteger(baseDelayMs) || baseDelayMs < 0) {
    throw new Error("baseDelayMs must be a non-negative integer")
  }

  return Object.freeze({
    maxAttempts,
    delayForAttempt(attempt) {
      return baseDelayMs * 2 ** Math.max(0, attempt - 1)
    },
    shouldRetry(error) {
      return error?.retryable === true
    },
  })
}

export async function executeWithRetry(operation, policy, sleep = async () => {}) {
  let lastError
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    try {
      return { attempt, value: await operation(attempt) }
    } catch (error) {
      lastError = error
      if (attempt === policy.maxAttempts || !policy.shouldRetry(error)) throw error
      await sleep(policy.delayForAttempt(attempt))
    }
  }
  throw lastError
}
