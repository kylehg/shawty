/**
 * @fileoverview Methods for reading/writing stats about URLs.
 */
'use strict'

const model = require('./model')

class StatsService {
  constructor(statsTable, Promise) {
    this._statsTable = statsTable
    this._Promise = Promise
  }

  record(urlHit) {
    if (!(urlHit instanceof model.UrlHit)) {
      return this._Promise.reject(
          new Error('Attempted to record a non-UrlHit object'))
    }

    return this._statsTable.push(urlHit.shortPath, urlHit.toJS())
      .then(() => urlHit)
  }
}

module.exports = StatsService
