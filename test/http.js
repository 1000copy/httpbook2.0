
var assert = require('assert')
var http = require('http')
var request = require('supertest')


var min = 60 * 1000;

describe('http', function(){
  it('http', function(done){
    function setup (req,res) {
      res.end('hello')
    }
    request(createServer(setup))
    .get('/')
    .expect('hello')
    .expect(200, done)
  })
  it('http setCookie', function(done){
    function handle (req,res) {
      res.setHeader('set-cookie','sessionid=1')
      res.end('hello')
    }
    request(createServer(handle))
    .get('/')
    .expect('hello')
    .expect(shouldSetCookie('sessionid'))
    .expect(200, done)
  })
  it('http setCookie', function(done){
    function handle (req,res) {
      res.setHeader('set-cookie','sessionid=1')
      if (req.headers.cookie)
        res.end(req.headers.cookie)
      else
        res.end('hello')
    }
    var server = createServer(handle)
    request(server)
    .get('/')
    .expect('hello')
    .expect(shouldSetCookie('sessionid'))
    .expect(200, function (err, res) {
      if (err) return done(err)
      request(server)
      .get('/')
      .set('Cookie', cookie(res))
      .expect(200,'sessionid=1', done)
    })
  })
})

function cookie(res) {
  var setCookie = res.headers['set-cookie'];
  return (setCookie && setCookie[0]) || undefined;
}

function createServer (respond) {
  var server = http.createServer()
  return server.on('request', createRequestListener(respond))
}

function createRequestListener(respond) {
  return function onRequest(req, res) {
    respond(req, res)
  }
}

function parseSetCookie (header) {
  var match
  var pairs = []
  var pattern = /\s*([^=;]+)(?:=([^;]*);?|;|$)/g

  while ((match = pattern.exec(header))) {
    pairs.push({ name: match[1], value: match[2] })
  }

  var cookie = pairs.shift()

  for (var i = 0; i < pairs.length; i++) {
    match = pairs[i]
    cookie[match.name.toLowerCase()] = (match.value || true)
  }

  return cookie
}

function shouldNotHaveHeader(header) {
  return function (res) {
    assert.ok(!(header.toLowerCase() in res.headers), 'should not have ' + header + ' header')
  }
}
function shouldSetCookie (name) {
  return function (res) {
    var header = cookie(res)
    var data = header && parseSetCookie(header)
    assert.ok(header, 'should have a cookie header')
    assert.equal(data.name, name, 'should set cookie ' + name)
  }
}

