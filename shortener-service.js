/**
 * @fileoverview Methods for shortening and looking up URLs.
 */
'use strict'

const immutable = require('immutable')

const responses = require('./responses')
const utils = require('./utils')

const UrlRecord = immutable.Record({
  targetUrl: '',
  shortPath: '',
  createdAt: 0,
  isCustomPath: false,
})

class ShortenerService {
  constructor(urlTable) {
    this._urlTable = urlTable
  }

  /**
   * @param {customPath} string
   * @param {url} string
   * @return {!Promise.<!UrlRecord>}
   */
  createCustomShortUrl(customPath, url) {
    return this.getUrlRecordByPath(customPath).then((urlRecord) => {
      if (urlRecord) {
        throw new responses.ApiError(409, `Custom path "${customPath}" is already taken`)
      }

      return this.putUrlRecord(customPath, url, /* isCustomPath */ true)
    })
  }

  /**
   * @param {url} string
   * @return {!Promise.<!UrlRecord>}
   */
  getOrCreateRandomShortUrl(url) {
    return this.getUrlRecordByTargetUrl(url).then((existingRecord) => {
      if (existingRecord) return existingRecord

      return this.createRandomShortUrl(url)
    })
  }

  /**
   * @param {url} string
   * @return {!Promise.<!UrlRecord>}
   */
  createRandomShortUrl(url) {
    const path = utils.generateRandomPath()
    return this.getUrlRecordByPath(path).then((urlRecord) => {
      // In the rare case we generate an existing random URL, try again
      if (urlRecord) return this.createRandomShortUrl(url)

      return this.putUrlRecord(path, url)
    })
  }

  /**
   * @param {string} path
   * @param {string} url
   * @param {boolean=} opt_isCustomPath
   * @return {!Promise.<!UrlRecord>}
   */
  putUrlRecord(path, url, opt_isCustomPath) {
    const record = new UrlRecord({
      targetUrl: url,
      shortPath: path,
      createdAt: Date.now(),
      isCustomPath: !!opt_isCustomPath,
    })
    return this._urlTable.set(path, record.toJS()).then(() => record)
  }

  /**
   * @param {string} shortPath
   * @return {!Promise.<UrlRecord>}
   */
  getUrlRecordByPath(shortPath) {
    return this._urlTable.get(shortPath)
      .then((snapshot) => snapshot.val() && new UrlRecord(snapshot.val()))
  }

  /**
   * @param {string} targetUrl
   * @return {!Promise.<UrlRecord>}
   */
  getUrlRecordByTargetUrl(targetUrl) {
    return this._urlTable.queryChildEqualTo('targetUrl', targetUrl)
      .then((snapshot) => {
        const records = []
        snapshot.forEach((data) => {
          const record = data.val()
          if (!record.isCustomPath) records.push(record)
        })
        if (records.length > 1) {
          console.error(
              `Found multiple paths for ${targetUrl}: ${records.length}`)
        }
        return records[0] ? new UrlRecord(records[0]) : null
      })
  }
}

module.exports = ShortenerService
