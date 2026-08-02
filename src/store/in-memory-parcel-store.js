export class InMemoryParcelStore {
  #parcels = new Map()

  async get(id) {
    return this.#parcels.get(id) ?? null
  }

  async save(parcel) {
    this.#parcels.set(parcel.id, parcel)
    return parcel
  }

  async list() {
    return [...this.#parcels.values()]
  }
}
