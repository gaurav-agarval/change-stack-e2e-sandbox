export class EventDispatchError extends Error {
  constructor(event, failures) {
    super(`${failures.length} handler(s) failed for ${event.type}`)
    this.name = "EventDispatchError"
    this.event = event
    this.failures = Object.freeze(failures)
  }
}

export class EventBus {
  #handlers = new Map()

  subscribe(type, handler) {
    const handlers = this.#handlers.get(type) ?? new Set()
    handlers.add(handler)
    this.#handlers.set(type, handlers)
    return () => handlers.delete(handler)
  }

  async publish(event) {
    const handlers = [
      ...(this.#handlers.get(event.type) ?? []),
      ...(this.#handlers.get("*") ?? []),
    ]
    const results = await Promise.allSettled(
      handlers.map((handler) => Promise.resolve().then(() => handler(event))),
    )
    const failures = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason)
    if (failures.length > 0) throw new EventDispatchError(event, failures)
    return { deliveredTo: handlers.length }
  }
}
