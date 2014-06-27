var assert = require('assert')
var config = require('config')
var http = require('http')
var bencode = require('bencode')
var crypto = require('crypto')

var loc = 'http://localhost:' + config.port + '/?'

var fetch = function(query, done) {
    http.get(loc + query, function (res) {
        var buff = new Buffer(0)

        res.on('data', function(data) {
            buff = Buffer.concat([buff, data])
        })

        res.on('end', function() {
            done(buff)
        })
    })
}

var isBadInput = function (done) {
    return function (res) {
        var test = bencode.encode({failure_reason: 'Bad input.'})

        assert.equal(res.toString(), test.toString())

        done()
    }
}

console.log('Tracker must be running!')

describe('Bad Input', function() {
    it('should reject a non-hexadecimal peer id', function (done) {
        var pid = 'peer_id=' + crypto.randomBytes(30).toString('base64')

        fetch(pid + '&port=2222&event=started', isBadInput(done))
    })

    it('should reject a peer id that is wrong length', function (done) {
        var pid = 'peer_id=' + crypto.randomBytes(19).toString('hex')

        fetch(pid + '&port=2222&event=started', isBadInput(done))
    })

    it('should reject a mal-formed port', function (done) {
        var pid = 'peer_id=' + crypto.randomBytes(20).toString('hex')

        fetch(pid + '&port=2abc&event=started', isBadInput(done))
    })

    it('should reject an above-bounds port', function (done) {
        var pid = 'peer_id=' + crypto.randomBytes(20).toString('hex')

        fetch(pid + '&port=70000&event=started', isBadInput(done))
    })

    it('should reject an under-bounds port', function (done) {
        var pid = 'peer_id=' + crypto.randomBytes(20).toString('hex')

        fetch(pid + '&port=-1&event=started', isBadInput(done))
    })

    it('should reject an invalid ip', function (done) {
        var pid = 'peer_id=' + crypto.randomBytes(20).toString('hex')
        var ip = 'ip=' + crypto.randomBytes(7).toString('base64')

        fetch(pid + '&' + ip + '&port=2223&event=started', isBadInput(done))
    })

    it('should reject a mal-formed peers request', function (done) {
        var pid = 'peer_id=' + crypto.randomBytes(20).toString('hex')

        fetch(pid + '&port=2224&peers=abc&event=started', isBadInput(done))
    })

    it('should reject an unknown event', function (done) {
        var pid = 'peer_id=' + crypto.randomBytes(20).toString('hex')
        var ev = 'event=' + crypto.randomBytes(4).toString('hex')

        fetch(pid + '&port=2225&' + ev, isBadInput(done))
    })
})
