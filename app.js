/**
 * @fileoverview Main app
 */
'use strict'
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const logger = require('morgan')
const path = require('path')
const serveFavicon = require('serve-favicon')

const config = require('./config')
const controllers = require('./controllers')

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
app.route('/').get(controllers.showHome)
app.route('/').post(controllers.shortenUrl)
app.route('/:shortPath').get(controllers.redirectShortPath)
app.route('/:shortPath/stat').get(controllers.statShortPath)

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


module.exports = app
