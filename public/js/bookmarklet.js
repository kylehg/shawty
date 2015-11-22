!function (window, undefined) {
  var domain = 'http://kjh.pw/'
  var url = window.location.href
  var request = new XMLHttpRequest()
  request.open('POST', domain, true)
  request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
  request.send(JSON.stringify({url: url}))
  request.onload = function () {
    if (this.status == 201) {
      showPopup
    }
  }
  request.onerror = function () {
    console.error(this)
  }

  function showPopup(innerHtml) {

  }
}(this)
