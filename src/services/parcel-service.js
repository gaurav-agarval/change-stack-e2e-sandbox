import { createParcel, transitionParcel } from "../domain/parcel.js"

export class ParcelService {
  constructor(store) {
    this.store = store
  }

  async register(input) {
    const existing = await this.store.get(input.id)
    if (existing) throw new Error(`Parcel ${input.id} already exists`)
    return this.store.save(createParcel(input))
  }

  async transition(id, nextStatus) {
    const parcel = await this.store.get(id)
    if (!parcel) throw new Error(`Parcel ${id} was not found`)
    return this.store.save(transitionParcel(parcel, nextStatus), {
      expectedVersion: parcel.version,
    })
  }

  async list(filter) {
    return this.store.list(filter)
  }
}
