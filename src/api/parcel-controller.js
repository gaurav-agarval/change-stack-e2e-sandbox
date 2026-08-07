function response(status, body) {
  return Object.freeze({ status, body: Object.freeze(body) })
}

export class ParcelController {
  constructor({ parcelService, routingService }) {
    this.parcelService = parcelService
    this.routingService = routingService
  }

  async register(request) {
    try {
      const parcel = await this.parcelService.register(request.body ?? {})
      return response(201, { parcel })
    } catch (error) {
      return response(400, { error: error.message })
    }
  }

  async previewRoutes(request) {
    try {
      const candidates = await this.routingService.preview(request.params.id)
      return response(200, { candidates })
    } catch (error) {
      return response(404, { error: error.message })
    }
  }

  async assignRoute(request) {
    try {
      const result = await this.routingService.assignBestRoute(request.params.id)
      return response(200, result)
    } catch (error) {
      const missing = error.message.includes("was not found")
      return response(missing ? 404 : 409, { error: error.message })
    }
  }
}
