'use strict'

exports.env = process.env.NODE_ENV
exports.firebaseUrl = exports.env == 'test'
    ? process.env.TEST_FIREBASE_URL
    : process.env.FIREBASE_URL
exports.host = exports.env == 'production'
    ? `http://${process.env.HOSTNAME}`
    : 'http://localhost:5000'
