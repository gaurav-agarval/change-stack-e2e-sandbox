export class AuditLog {
  #entries = []

  record(action, details, occurredAt = new Date()) {
    const entry = Object.freeze({
      sequence: this.#entries.length + 1,
      action,
      details: Object.freeze({ ...details }),
      occurredAt: occurredAt.toISOString(),
    })
    this.#entries.push(entry)
    return entry
  }

  list({ action } = {}) {
    const entries = action
      ? this.#entries.filter((entry) => entry.action === action)
      : this.#entries
    return [...entries]
  }
}

export function withAudit(service, auditLog) {
  return {
    async assignBestRoute(parcelId) {
      try {
        const result = await service.assignBestRoute(parcelId)
        auditLog.record("route.assigned", {
          parcelId,
          routeId: result.route.id,
        })
        return result
      } catch (error) {
        auditLog.record("route.rejected", { parcelId, reason: error.message })
        throw error
      }
    },
    preview(parcelId) {
      return service.preview(parcelId)
    },
  }
}
