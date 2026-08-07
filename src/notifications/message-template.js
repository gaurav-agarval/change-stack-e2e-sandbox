const statusMessages = new Map([
  ["created", "Your parcel has been registered."],
  ["in_transit", "Your parcel is moving toward its destination."],
  ["delivered", "Your parcel has been delivered."],
])

export function renderStatusMessage(event, preference) {
  const message = statusMessages.get(event.currentStatus)
  if (!message) return null
  const prefix = preference.locale === "compact" ? "Update:" : "Parcel update:"
  return Object.freeze({
    channel: preference.channel,
    recipient: preference.recipient,
    subject: `${prefix} ${event.parcelId}`,
    body: `${message} Destination: ${event.destination}.`,
    deduplicationKey: `${event.parcelId}:${event.version}:${preference.channel}`,
  })
}
