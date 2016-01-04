/**
 * @fileoverview Bookmarklet code for saving short links.
 */
;(function (window) {
  'use strict'

  var DOMAIN = 'http://kjh.pw'

  /**
   * @param {string} path
   * @param {Object} body
   * @param {function(Object)} onSuccess
   * @param {function(Error)} onError
   */
  function post(path, body, onSuccess, onError) {
    var request = new XMLHttpRequest()
    request.open('POST', domain, true)
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
    request.send(JSON.stringify(body))
    request.onload = function () {
      var payload = JSON.parse(this.responseText)
      if (200 <= this.status && this.status < 400) {
        onSuccess(payload.data)
      } else {
        onError(payload.error)
      }
    }
    request.onerror = function () {
      console.error("Network error", this)
      onError()
    }
  }

  function showSuccessDialog(shortUrl) {

  }

  function showError(errMsg) {

  }


  var url = window.location.href
  post('/', {url: url}, function (data) {
    showSuccessDialog(data.shortUrl)
  }, function (err) {
    showError(err.message)
  })
}(this));
