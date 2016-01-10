/**
 * @fileoverview Main application controllers.
 */
'use strict'

const responses = require('./responses')

class Controllers {
  constructor(config, shortenerService) {
    this._config = config
    this._shortenerService = shortenerService
  }

  showHome(req, res, next) {
    return new responses.TemplateResponse('index', {
      title: 'Shawty',
      host: `${this._config.host}/`.replace('http://', ''),
      ijData: JSON.stringify({
        host: this._config.host,
      }),
    })
  }

  shortenUrl(req, res, next) {
    const url = req.body.url && req.body.url.trim()
    const customPath = req.body.customPath &&
        req.body.customPath.trim()
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
        shortUrl: `${this._config.host}/${urlRecord.shortPath}`,
        path: urlRecord.shortPath,
      })
    })
  }

  statShortPath(req, res, next) {
    const path = req.params.shortPath
    return this._shortenerService.getUrlRecordByPath(path).then((urlRecord) => {
      return new responses.ApiResponse(200, urlRecord.toJS())
    })
  }

  redirectShortPath(req, res, next) {
    const path = req.params.shortPath
    this._shortenerService.getUrlRecordByPath(path).then((urlRecord) => {
      if (!urlRecord) return next()
      res.redirect(urlRecord.targetUrl)
    })
  }
}

module.exports = Controllers
