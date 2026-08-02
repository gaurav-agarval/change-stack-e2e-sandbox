export class MemoryNotificationTransport {
  #messages = []
  #seen = new Set()

  async send(message) {
    if (this.#seen.has(message.deduplicationKey)) {
      return { duplicate: true, accepted: false }
    }
    this.#seen.add(message.deduplicationKey)
    this.#messages.push(message)
    return { duplicate: false, accepted: true }
  }

  messages() {
    return [...this.#messages]
  }
}
