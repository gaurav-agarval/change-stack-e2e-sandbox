export class NotificationMetrics {
  #counters = new Map()

  increment(name, labels = {}) {
    const labelKey = Object.entries(labels)
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join(",")
    const key = labelKey ? `${name}{${labelKey}}` : name
    this.#counters.set(key, (this.#counters.get(key) ?? 0) + 1)
  }

  snapshot() {
    return Object.fromEntries([...this.#counters.entries()].toSorted())
  }
}
