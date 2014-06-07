var koa = require('koa')
var config = require('config')
var bencode = require('bencode')
var validator = require('validator')

var peer = require('./peer.' + config.database + '.js')

// Load middleware.
var logger    = require('koa-logger')

// Setup
var app = koa()
app.use(logger())

// Request Handlers
app.use(function *(next) {
    this.set('Content-Type', 'text/plain')

    // Validate input.
    ok = true

    ok &= validator.isHexadecimal(this.query.peer_id)
    ok &= validator.isLength(this.query.peer_id, 40, 40)

    ok &= validator.isInt(this.query.port)
    if (this.query.port < 0 || this.query.port > 65535) { ok = false }

    if (this.query.ip != null) { ok &= validator.isIP(this.query.ip) }

    if (this.query.peers != null) { ok &= validator.isInt(this.query.peers) }

    if (this.query.event != null) {
        ok &= validator.isIn(this.query.event, ['started', 'stopped'])
    }

    if (ok) {
        yield next
    } else {
        this.body = bencode.encode({failure_reason: 'Bad input.'})
    }
})

app.use(function *() {
    // Default some variables if we can.
    var ip, peers, recommend

    if (this.query.ip != null) { ip = this.query.ip }
    else { ip = this.ip }

    if (this.query.peers != null) { peers = this.query.peers }
    else { peers = config.defaultPeers }

    // Handle the peer's request.
    var ok
    if (this.query.event === 'started') {
        ok = yield peer.create(this.query.peer_id, ip, this.query.port)
    } else if (this.query.event === 'stopped') {
        ok = yield peer.delete(this.query.peer_id, ip, this.query.port)
    } else {
        ok = yield peer.keepAlive(this.query.peer_id, ip, this.query.port)
    }

    if (ok) {
        // Throw some data back.
        var recommend = yield peer.recommend(this.query.peer_id, peers)

        output = {
            interval: config.interval,
            peers: recommend,
        }

        this.body = bencode.encode(output)
    } else {
        this.body = bencode.encode({failure_reason: 'Bad flow.'})
    }
})

// Start tracker.
app.listen(config.port)
console.log('Server up at:  http://localhost:' + config.port + '/')
