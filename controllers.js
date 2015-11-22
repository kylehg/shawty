/**
 * @fileoverview Main application controllers
 */
'use strict'

const Firebase = require('firebase')
const crypto = require('crypto')
const immutable = require('immutable')

const FirebaseClient = require('./firebase-client')
const config = require('./config')

const db = new FirebaseClient(new Firebase(config.firebaseUrl))
const urlTable = db.child('urls')

class ApiError {
  constructor(status, message) {
    this.status = status
    this.message = message
  }
}

class ApiResponse {
  constructor(status, data) {
    this.status = status
    this.data = data
  }
}

const UrlRecord = immutable.Record({
  targetUrl: '',
  shortPath: '',
  createdAt: 0,
  isCustomPath: false,
})

exports.showHome = makeExpressHandler((req) => {
  return new ApiResponse(200, {status: 'ok'})
})

exports.shortenUrl = makeExpressHandler((req) => {
  const url = req.body.url && req.body.url.trim()
  const customPath = req.body.customPath && req.body.customPath.trim()
  if (!url) {
    throw new ApiError(400, 'Missing "url" field.')
  }
  if (customPath != null && !/^[A-Za-z0-9-_]+$/.test(customPath)) {
    throw new ApiError(400, 'Custom path must be in [A-Za-z0-9-_]')
  }

  const createPromise = customPath != null
      ? createCustomShortUrl(customPath, url)
      : getOrCreateRandomShortUrl(url)
  return createPromise.then((urlRecord) => {
    return new ApiResponse(201, {
      url: urlRecord.targetUrl,
      shortUrl: `${config.host}/${urlRecord.shortPath}`,
      path: urlRecord.shortPath,
    })
  })
})

exports.statShortPath = makeExpressHandler((req) => {
  const path = req.params.shortPath
  return getUrlRecordByPath(path).then((urlRecord) => {
    return new ApiResponse(200, urlRecord.toJS())
  })
})

exports.redirectShortPath = (req, res, next) => {
  const path = req.params.shortPath
  getUrlRecordByPath(path).then((urlRecord) => {
    if (!urlRecord) return next()
    res.redirect(urlRecord.targetUrl)
  })
}

/**
 * @param {customPath} string
 * @param {url} string
 * @return {!Promise.<!UrlRecord>}
 */
function createCustomShortUrl(customPath, url) {
  return getUrlRecordByPath(customPath).then((urlRecord) => {
    if (urlRecord) {
      throw new ApiError(409, `Custom path "${customPath}" is already taken.`)
    }

    return putUrlRecord(customPath, url, /* isCustomPath */ true)
  })
}

/**
 * @param {url} string
 * @return {!Promise.<!UrlRecord>}
 */
function getOrCreateRandomShortUrl(url) {
  return getUrlRecordByTargetUrl(url).then((existingRecord) => {
    if (existingRecord) return existingRecord

    return createRandomShortUrl(url)
  })
}

/**
 * @param {url} string
 * @return {!Promise.<!UrlRecord>}
 */
function createRandomShortUrl(url) {
  const path = generateRandomPath()
  return getUrlRecordByPath(path).then((urlRecord) => {
    // In the rare case we generate an existing random URL, try again
    if (urlRecord) return createRandomShortUrl(url)

    return putUrlRecord(path, url)
  })
}

/**
 * Generate a random 5-character string for the URL path, in [A-Za-z0-9].
 * @return {string}
 */
function generateRandomPath() {
  const rawString = crypto.randomBytes(4).toString('base64')
  return rawString
      .replace(/\+/g, 'k')
      .replace(/\//g, 'j')
      .substring(0, 5)
}

/**
 * @param {string} path
 * @param {string} url
 * @param {boolean=} opt_isCustomPath
 * @return {!Promise.<!UrlRecord>}
 */
function putUrlRecord(path, url, opt_isCustomPath) {
  const record = new UrlRecord({
    targetUrl: url,
    shortPath: path,
    createdAt: Date.now(),
    isCustomPath: !!opt_isCustomPath,
  })
  return urlTable.set(path, record.toJS()).then(() => record)
}

/**
 * @param {string} shortPath
 * @return {!Promise.<UrlRecord>}
 */
function getUrlRecordByPath(shortPath) {
  return urlTable.get(shortPath)
    .then((snapshot) => snapshot.val() && new UrlRecord(snapshot.val()))
}

/**
 * @param {string} targetUrl
 * @return {!Promise.<UrlRecord>}
 */
function getUrlRecordByTargetUrl(targetUrl) {
  return urlTable.queryChildEqualTo('targetUrl', targetUrl)
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

/**
 * @param {function(express.Request}:!Promise.<!ApiResponse>} handler
 * @return {function(express.Request, express.Response)}
 */
function makeExpressHandler(handler) {
  return (req, res, next) => {
    let handlerResult
    try {
      handlerResult = handler(req)
    } catch (err) {
      if (err instanceof ApiError) {
        return res.status(err.status).send({error: err.message})
      }
      return next(err)
    }

    const promise = handlerResult instanceof Promise
        ? handlerResult
        : Promise.resolve(handlerResult)

    promise.then((result) => {
      if (result instanceof ApiResponse) {
        return res.status(result.status).send({data: result.data})
      }
      // Attempt to just send down an untyped result
      res.send(result)
    }, (err) => {
      if (err instanceof ApiError) {
        return res.status(err.status).send({error: err.message})
      }
      return next(err)
    })
  }
}
