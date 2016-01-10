/**
 * @fileoverview A Promise-based Firebase client.
 */
'use strict'

class FirebaseClient {
  /**
   * @param {Firebase} firebase The base Firebase reference.
   * @param {Function} Promise A Promise implementation to use.
   */
  constructor(firebase, Promise) {
    this._firebase = firebase
    this._Promise = Promise
  }

  /**
   * @param {string|Array.<string>} path
   * @param {*} value
   * @return {!Promise}
   */
  set(path, value) {
    return new this._Promise((resolve, reject) => {
      this.getReference(path).set(value, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * @param {string|Array.<string>} path
   * @param {*} updates
   * @return {!Promise}
   */
  update(path, updates) {
    return new this._Promise((resolve, reject) => {
      this.getReference(path).update(updates, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * @param {string|Array.<string>} path
   * @param {*} value
   * @return {!Promise.<string>} The ID of the pushed object
   */
  push(path, value) {
    return new this._Promise((resolve, reject) => {
      const ref = this.getReference(path).push(value, (err) => {
        if (err) reject(err)
        else resolve(ref.key())
      })
    })
  }

  /**
   * @param {string|Array.<string>} path
   * @return {!Promise.<DataSnapshot>}
   */
  get(path) {
    return this.query(this.getReference(path))
  }

  /**
   * @param {Firebase} ref
   * @return {!Promise.<DataSnapshot>}
   */
  query(ref) {
    return new this._Promise((resolve, reject) => {
      ref.once('value', (snapshot) => {
        resolve(snapshot)
      }, reject)
    })
  }

  /**
   * @param {string} key
   * @param {*} value
   * @return {!Promise.<DataSnapshot>}
   */
  queryChildEqualTo(key, value) {
    const queryRef = this.getReference().orderByChild(key).equalTo(value)
    return this.query(queryRef)
  }

  /**
   * @param {(string|Array.<string>)=} opt_path
   * @return {!Firebase}
   */
  getReference(opt_path) {
    if (!opt_path) return this._firebase
    const path = Array.isArray(opt_path) ? opt_path.join('/') : opt_path
    return this._firebase.child(path)
  }

  /**
   * @param {string|Array.<string>} path
   * @return {!FirebaseClient}
   */
  child(path) {
    const ref = this.getReference(path)
    return new FirebaseClient(ref, this._Promise)
  }
}

module.exports = FirebaseClient
