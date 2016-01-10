/**
 * @fileoverview Main public JavaScript
 */
(function () {
'use strict'

var getIjData

function main() {
  // Attach event handlers
  $('.js-shortenForm').on('submit', onSubmit)
  new Clipboard('.js-copyBtn')
  $('[data-toggle="tooltip"]').tooltip()

  // Setup injected data
  var ijData = window.__ijData__
  getIjData = function getIjData(name) {
    return ijData[name]
  }
  delete window.__ijData__

  console.log('Main JS loaded')
}

/**
 * @param {!Event} e
 */
function onSubmit(e) {
  e.preventDefault()

  var url = $('.js-inputUrl').val().trim()
  var customPath = $('.js-inputCustomPath').val().trim()
  var data = {url: url}
  if (customPath) {
    data.customPath = customPath
  }

  $.ajax({
    url: '/',
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    async: false,
    success: handleSuccess,
    error: handleError,
  })
}

/**
 * @param {Object} resp
 */
function handleSuccess(resp) {
  if (!resp || !resp.data) {
    showError('Response returned no data.')
    return
  }

  clearError()
  $('.js-resultsFormGroup').removeClass('hidden')
  $('.js-resultsField').val(resp.data.shortUrl)
  $('.js-submitBtn').addClass('hidden')
}

/**
 * @param {jqXHR} xhr
 */
function handleError(xhr, textStatus, errorThrown) {
  var error
  try {
    error = JSON.parse(xhr.responseText).error
  } catch (e) {
    error = errorThrown
  }
  if (300 <= xhr.status && xhr.status < 500) {
    showWarning(error)
  } else {
    showError(error)
  }
}

/**
 * @param {string} errMsg
 */
function showError(errMsg) {
  $('.js-errorMessage')
    .removeClass('alert-warning hidden')
    .addClass('alert-danger')
    .text(errMsg)
}

/**
 * @param {string} warnMsg
 */
function showWarning(warnMsg) {
  $('.js-errorMessage')
    .removeClass('alert-danger hidden')
    .addClass('alert-warning')
    .show()
    .text(warnMsg)
}

function clearError() {
  $('.js-errorMessage')
    .addClass('hidden')
    .removeClass('alert-danger alert-warning')
    .text('')
}

main()

}())
