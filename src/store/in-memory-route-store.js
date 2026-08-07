export class InMemoryRouteStore {
  #routes = new Map()

  constructor(routes = []) {
    for (const route of routes) this.#routes.set(route.id, route)
  }

  async get(id) {
    return this.#routes.get(id) ?? null
  }

  async save(route) {
    this.#routes.set(route.id, route)
    return route
  }

  async list() {
    return [...this.#routes.values()]
  }
}
