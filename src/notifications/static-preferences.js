export class StaticPreferences {
  constructor(entries = {}) {
    this.entries = new Map(Object.entries(entries))
  }

  async forParcel(parcelId) {
    return [...(this.entries.get(parcelId) ?? [])]
  }
}
