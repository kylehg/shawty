/**
 * @fileoverview Miscellaneous utility functions.
 */
'use strict'

const crypto = require('crypto')

/**
 * Generate a random 5-character string for the URL path, in [A-Za-z0-9].
 * @return {string}
 */
function generateRandomPath() {
  return crypto.randomBytes(4).toString('base64')
    .replace(/\+/g, 'k')
    .replace(/\//g, 'h')
    .substring(0, 5)
}

module.exports = {
  generateRandomPath,
}
