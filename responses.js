/**
 * @fileoverview Convenience objects for responding to HTTP requests.
 */
'use strict'

class Response {}

class ApiError extends Response {
  constructor(status, message) {
    super()
    this._status = status
    this._message = message
  }

  respond(res) {
    res.status(this._status).send({error: this._message})
  }
}

class ApiResponse extends Response {
  constructor(status, data) {
    super()
    this._status = status
    this._data = data
  }

  respond(res) {
    res.status(this._status).send({data: this._data})
  }
}

class TemplateResponse extends Response {
  constructor(template, data) {
    super()
    this._template = template
    this._data = data
  }

  respond(res) {
    res.render(this._template, this._data)
  }
}

module.exports = {
  ApiError,
  ApiResponse,
  Response,
  TemplateResponse,
}
