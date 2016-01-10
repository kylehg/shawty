/**
 * @fileoverview Main application controllers
 */
'use strict'

const config = require('./config')
const responses = require('./responses')

class Controllers {
  constructor(config, req, shortenerService) {
    this._config = config
    this._req = req
    this._shortenerService = shortenerService
  }

  showHome() {
    return new responses.TemplateResponse('index', {
      title: 'Shawty',
      host: `${config.host}/`.replace('http://', ''),
      ijData: JSON.stringify({
        host: config.host,
      }),
    })
  }

  shortenUrl() {
    const url = this._req.body.url && this._req.body.url.trim()
    const customPath = this._req.body.customPath &&
        this._req.body.customPath.trim()
    if (!url) {
      throw new responses.ApiError(400, 'Missing "url" field')
    }
    if (customPath != null && !/^[A-Za-z0-9-_]+$/.test(customPath)) {
      throw new responses.ApiError(400, 'Custom path must be in [A-Za-z0-9-_]')
    }

    const createPromise = customPath != null
        ? this._shortenerService.createCustomShortUrl(customPath, url)
        : this._shortenerService.getOrCreateRandomShortUrl(url)
    return createPromise.then((urlRecord) => {
      return new responses.ApiResponse(201, {
        url: urlRecord.targetUrl,
        shortUrl: `${config.host}/${urlRecord.shortPath}`,
        path: urlRecord.shortPath,
      })
    })
  }

  statShortPath() {
    const path = this._req.params.shortPath
    return this._shortenerService.getUrlRecordByPath(path).then((urlRecord) => {
      return new responses.ApiResponse(200, urlRecord.toJS())
    })
  }

  // TODO figure out route
  redirectShortPath() {
    const path = this._req.params.shortPath
    this._shortenerService.getUrlRecordByPath(path).then((urlRecord) => {
      if (!urlRecord) return next()
      res.redirect(urlRecord.targetUrl)
    })
  }
}

module.exports = Controllers
