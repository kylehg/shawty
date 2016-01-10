/**
 * @fileoverview A simple dependency injection container.
 */
'use strict'

const immutable = require('immutable')

const ProviderType = {
  CONSTANT: Symbol('constant'),
  FACTORY: Symbol('factory'),
  CTOR: Symbol('ctor'),
}

class Injector {
  constructor() {
    /** @private {!Map.<string, ProviderDescriptor>} */
    this._registry = new Map()

    /** @private {!Map.<string, *>} */
    this._built = new Map()
  }

  constant(dependencyName, constant) {
    return this._add(dependencyName, ProviderType.CONSTANT, constant, [])
  }

  factory(dependencyName, factory, opt_dependencies) {
    return this._add(
        dependencyName, ProviderType.FACTORY, factory, opt_dependencies)
  }

  ctor(dependencyName, Ctor, opt_dependencies) {
    return this._add(dependencyName, ProviderType.CTOR, Ctor, opt_dependencies)
  }

  get(providerName) {
    if (!this._registry.has(providerName)) {
      throw new Error(`No provider found for "${providerName}"`)
    }

    // Service has already been built, return it immediately
    if (this._built.has(providerName)) {
      return Promise.resolve(this._built.get(providerName))
    }

    const descriptor = this._registry.get(providerName)

    // Service is not built, build all dependencies necessary
    const promises = descriptor.dependencies.map((depName) =>
      this.get(depName)
    )

    return Promise.all(promises).then((dependencies) => {
      return this._build(descriptor, dependencies)
    })
    .then((result) => {
      this._built.set(providerName, result)
      return result
    })
  }

  _add(dependencyName, type, provider, opt_dependencies) {
    if (this._registry.has(dependencyName)) {
      throw new Error(`Injector already has provider for "${dependencyName}"`)
    }

    const dependencies =
        opt_dependencies || provider.$deps || parseDeps(provider)

    this._registry.set(dependencyName, new ProviderDescriptor({
      name: dependencyName,
      type,
      provider,
      dependencies,
    }))

    return this
  }

  _build(descriptor, dependencies) {
    switch (descriptor.type) {
    case ProviderType.CONSTANT:
      return descriptor.provider

    case ProviderType.FACTORY:
      return descriptor.provider.apply(null, dependencies)

    case ProviderType.CTOR:
      // ES6 classes cannot be called with anything but `new`, so we need
      // this dark magic to satisfy that constraint
      const args = dependencies.map((_, i) => 'x'+i).join(',')
      const fn = eval(`(function (${args}) { return new this(${args})})`)
      return fn.apply(descriptor.provider, dependencies)

    default:
      throw new Error(`Invalid provider type ${descriptor.type.toString()}`)
    }
  }
}

/**
 * Descriptor of a provider in the registry.
 * @constructor
 */
const ProviderDescriptor = immutable.Record({
  /** @type {string} The unique name of this provider */
  name: '',
  /** @type {ProviderType} The type of this provider */
  type: null,
  /** @type {*} The provider itself, actual type dependent on `type` */
  provider: null,
  /** @type {Array.<string>} A list of named dependencies */
  dependencies: null,
})


/**
 * @param {!Function} fn
 * @return {!Array.<string>}
 */
function parseDeps(fn) {
  if (typeof fn != 'function') {
    throw new Error('Can only parse dependencies of functions')
  }
  const fnStr = fn.toString()
  let keywordIdx = 0

  // In ES6, constructor functions may print as
  // function() { ... }
  // or
  // class { constructor() {} }
  const classMatch = /^class\b/.exec(fnStr)
  if (classMatch) {
    const ctorMatch = /\bconstructor\b/.exec(fnStr)
    if (!ctorMatch) {
      // Empty default ctor
      return []
    }

    keywordIdx = ctorMatch.index
  }

  const lParenIdx = fnStr.indexOf('(', keywordIdx)
  const rParenIdx = fnStr.indexOf(')', keywordIdx)

  // Check for existence of parentheses
  if (lParenIdx === -1 || rParenIdx === -1) {
    throw new Error('Invalid function')
  }

  // Isolate parameters
  const paramsStr = fnStr.substring(lParenIdx + 1, rParenIdx)
  if (paramsStr == '') {
    return []
  }

  // Remove whitespace
  return paramsStr.split(',').map(param => param.trim())
}

module.exports = {
  Injector,
  ProviderType,
}
