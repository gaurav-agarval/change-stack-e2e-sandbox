import { createParcel, transitionParcel } from "../domain/parcel.js"
import { parcelRegistered, parcelStatusChanged } from "../events/parcel-events.js"

export class ParcelService {
  constructor(store, { eventBus } = {}) {
    this.store = store
    this.eventBus = eventBus
  }

  async register(input) {
    const existing = await this.store.get(input.id)
    if (existing) throw new Error(`Parcel ${input.id} already exists`)
    const parcel = await this.store.save(createParcel(input))
    await this.eventBus?.publish(parcelRegistered(parcel))
    return parcel
  }

  async transition(id, nextStatus) {
    const parcel = await this.store.get(id)
    if (!parcel) throw new Error(`Parcel ${id} was not found`)
    const updated = await this.store.save(transitionParcel(parcel, nextStatus))
    await this.eventBus?.publish(parcelStatusChanged(parcel, updated))
    return updated
  }

  async list() {
    return this.store.list()
  }
}
