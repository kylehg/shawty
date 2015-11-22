/**
 * @fileoverview High-level endpoint tests.
 */
'use strict'

const Firebase = require('firebase')
const assert = require('assert')
const url = require('url')
const supertest = require('supertest')

const FirebaseClient = require('../firebase-client')
const app = require('../app')
const config = require('../config')

const db = new FirebaseClient(new Firebase(config.firebaseUrl))
const urlTable = db.child('urls')

afterEach(() => {
  return db.set('urls', null)
})

describe('GET /', () => {
  it('should respond with a heartbeat', (done) => {
    supertest(app)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200, {
        data: {status: 'ok'}
      })
      .end(done)
  })
})

describe('POST /', () => {
  it('should create a new random short link', (done) => {
    const now = Date.now()
    supertest(app)
      .post('/')
      .send({url: 'http://nytimes.com'})
      .expect(201)
      .end((err, res) => {
        if (err) done(err)
        const data = res.body.data
        assert.equal(data.url, 'http://nytimes.com')
        const path = url.parse(data.shortUrl).path.substring(1)
        assert.equal(path, data.path)
        assert.ok(/^[A-Za-z0-9]{5}$/g.test(path))

        urlTable.get(path).then((record) => {
          record = record.val()
          assert.equal(record.targetUrl, 'http://nytimes.com')
          assert.equal(record.shortPath, path)
          assert.equal(record.isCustomPath, false)
          assert.ok(record.createdAt > now)
        }).then(done, done)
      })
  })

  it('should create new custom short links', (done) => {
    const now = Date.now()
    supertest(app)
      .post('/')
      .send({
        url: 'http://nytimes.com',
        customPath: 'nyt',
      })
      .expect(201)
      .end((err, res) => {
        if (err) done(err)
        const data = res.body.data
        assert.equal(data.url, 'http://nytimes.com')
        assert.equal(url.parse(data.shortUrl).path, '/nyt')
        assert.equal(data.path, 'nyt')

        urlTable.get(data.path).then((record) => {
          record = record.val()
          assert.equal(record.targetUrl, 'http://nytimes.com')
          assert.equal(record.shortPath, 'nyt')
          assert.equal(record.isCustomPath, true)
          assert.ok(record.createdAt > now)
        }).then(done, done)
      })
  })

  it('should reuse existing random short links', (done) => {
    urlTable.set('Dk9fl', {
      targetUrl: 'http://news.ycombinator.com',
      shortPath: 'Dk9fl',
      createdAt: Date.now(),
      isCustomPath: false,
    })
      .then(() => {
        supertest(app)
          .post('/')
          .send({url: 'http://news.ycombinator.com'})
          .expect(201, {
            data: {
              url: 'http://news.ycombinator.com',
              shortUrl: 'http://localhost:3000/Dk9fl',
              path: 'Dk9fl',
            }
          })
          .end(done)
      })
  })

  it('should not reuse existing custom short links', (done) => {
    urlTable.set('hnsux', {
      targetUrl: 'http://news.ycombinator.com',
      shortPath: 'hnsux',
      createdAt: Date.now(),
      isCustomPath: true,
    })
      .then(() => {
        supertest(app)
          .post('/')
          .send({url: 'http://news.ycombinator.com'})
          .expect(201)
          .expect((res) => {
            const data = res.body.data
            assert.notEqual(data.path, 'hnsux')
            assert.ok(/^[A-Za-z0-9]{5}$/g.test(data.path))
            assert.equal(data.url, 'http://news.ycombinator.com')
          })
          .end(done)
      })
  })

  it('should not accept invalid custom short links', (done) => {
    supertest(app)
      .post('/')
      .send({url: 'http://jeb.com', customPath: 'jeb!'})
      .expect(400)
      .end(done)
  })

  it('should not accept in-use custom short links', (done) => {
    urlTable.set('hnsux', {
      targetUrl: 'http://news.ycombinator.com',
      shortPath: 'hnsux',
      createdAt: Date.now(),
    })
      .then(() => {
        supertest(app)
          .post('/')
          .send({url: 'http://jeb.com', customPath: 'hnsux'})
          .expect(409)
          .end(done)
      })
  })
})
