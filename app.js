/**
 * @fileoverview Main app.
 */
'use strict'

const Firebase = require('firebase')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const logger = require('morgan')
const path = require('path')
const serveFavicon = require('serve-favicon')

const Controllers = require('./controllers')
const FirebaseClient = require('./firebase-client')
const ShortenerService = require('./shortener-service')
const config = require('./config')
const di = require('./di')
const responses = require('./responses')

const app = express()

// Middleware setup

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// app.use(serveFavicon(`${__dirname}/public/favicon.ico`))
if (config.env != 'test') {
  app.use(logger('dev'))
}
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// Main handlers
app.route('/').get(getController('showHome'))
app.route('/').post(getController('shortenUrl'))
app.route('/:shortPath').get(getController('redirectShortPath'))
app.route('/:shortPath/stat').get(getController('statShortPath'))

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Error handlers

// Development error handler - will print stacktrace
if (app.get('env') == 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}

// Production error handler - no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})

/**
 * @param {string} name
 * @return {function(express.Request, express.Response)}
 */
function getController(name) {
  return function expressHandler(req, res, next) {
    // Setup injector
    const ij = new di.Injector()
      .constant('config', config)
      .constant('Promise', Promise)
      .factory('firebase', (config) => new Firebase(config.firebaseUrl))
      .ctor('db', FirebaseClient)
      .factory('urlTable', (db) => db.child('urls'))
      .ctor('controllers', Controllers)
      .ctor('shortenerService', ShortenerService)

    ij.get('controllers').then((controllers) => {
      return controllers[name](req, res, next)
    })
    .then((result) => {
      if (result instanceof responses.Response) {
        return result.respond(res)
      } else if (result) {
        // Attempt to just send down an untyped result
        console.error(`Received untyped response ${result}`)
        res.send(result)
      }
    }, (err) => {
      if (err instanceof responses.Response) {
        return err.respond(res)
      }
      throw err
    })
    .catch(next)
  }
}

module.exports = app
