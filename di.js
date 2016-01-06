/**
 * @fileoverview A simple dependency injection container.
 */
'use strict'

const ProviderType = {

}

class Injector {
  constructor() {
    /** @private {!Map.<string, Provider>} */
    this._providers = new Map()
  }

  get(dependencyName) {
    if (!this._providers.has(dependencyName)) {
      throw new Error(`No provider found found for "${dependencyName}`)
    }

    const provider = this._providers.get(dependencyName)
    return this._build(provider)
  }

  constant(dependencyName, constant) {
    this._providers.set(dependencyName, new Provider({
      name: dependencyName,
      type:
    }))
  }
}

