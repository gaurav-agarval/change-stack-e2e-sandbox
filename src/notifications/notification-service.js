import { renderStatusMessage } from "./message-template.js"
import { createRetryPolicy, executeWithRetry } from "./retry-policy.js"

export class NotificationService {
  constructor({ preferences, transports, metrics, retryPolicy, sleep }) {
    this.preferences = preferences
    this.transports = transports
    this.metrics = metrics
    this.retryPolicy = retryPolicy ?? createRetryPolicy()
    this.sleep = sleep
  }

  async handle(event) {
    if (event.type !== "parcel.status_changed") return { skipped: true }
    const preferences = await this.preferences.forParcel(event.parcelId)
    const outcomes = []

    for (const preference of preferences) {
      const message = renderStatusMessage(event, preference)
      if (!message) continue
      const transport = this.transports[message.channel]
      if (!transport) {
        this.metrics.increment("notification.unsupported", {
          channel: message.channel,
        })
        outcomes.push({ channel: message.channel, status: "unsupported" })
        continue
      }

      try {
        const result = await executeWithRetry(
          () => transport.send(message),
          this.retryPolicy,
          this.sleep,
        )
        this.metrics.increment("notification.sent", {
          channel: message.channel,
        })
        outcomes.push({
          attempts: result.attempt,
          channel: message.channel,
          status: result.value.duplicate ? "duplicate" : "sent",
        })
      } catch (error) {
        this.metrics.increment("notification.failed", {
          channel: message.channel,
        })
        outcomes.push({
          channel: message.channel,
          reason: error.message,
          status: "failed",
        })
      }
    }
    return { outcomes, skipped: false }
  }
}
