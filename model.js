/**
 * @fileoverview DB models.
 */
'use strict'

const immutable = require('immutable')

const UrlRecord = immutable.Record({
  targetUrl: '',
  shortPath: '',
  createdAt: 0,
  isCustomPath: false,
})

const UrlHit = immutable.Record({
  shortPath: '',
  // This is redundant info but denormalized for funsies
  targetUrl: '',
  occurredAt: 0,
  requestIp: '',
  requestHeaders: null,
  requestQuery: null,
  requestBody: null,
})

module.exports = {
  UrlRecord,
  UrlHit,
}
