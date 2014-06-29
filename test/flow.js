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

var pid1 = crypto.randomBytes(20).toString('hex')
var pid2 = crypto.randomBytes(20).toString('hex')

console.log('Note:  Peer expiration can not be unit tested!')
console.log('       Running tests in quick succession may cause state errors.')

describe('Flow', function() {
    it('should offer no recommendations', function (done) {
        fetch('peer_id=' + pid1 + '&port=2222&event=started', function (res) {
            var obj = bencode.decode(res, 'utf8')

            assert.equal(obj.interval, config.interval)
            assert.equal(obj.now, Math.floor(Date.now() / 1000))
            assert.equal(obj.head.length, 40)
            assert.equal(obj.peers.length, 0)

            done()
        })
    })

    it('should refuse due to bad flow', function (done) {
        fetch('peer_id=' + pid1 + '&port=2222&event=started', function (res) {
            var test = bencode.encode({failure_reason: 'Bad flow.'})

            assert.equal(res.toString(), test.toString())

            done()
        })
    })

    it('should offer other peer as only recommendation', function (done) {
        fetch('peer_id=' + pid2 + '&port=2223&event=started', function (res) {
            var obj = bencode.decode(res, 'utf8')

            assert.equal(obj.interval, config.interval)
            assert.equal(obj.now, Math.floor(Date.now() / 1000))
            assert.equal(obj.head.length, 40)
            assert.equal(obj.peers.length, 1)
            assert.equal(obj.peers[0].peer_id, pid1)
            assert.notEqual(typeof(obj.peers[0].ip), undefined)
            assert.notEqual(obj.peers[0].ip, null)
            assert.equal(obj.peers[0].port, '2222')

            done()
        })
    })

    it('should give standard response to update', function (done) {
        fetch('peer_id=' + pid1 + '&port=2222', function (res) {
            var obj = bencode.decode(res, 'utf8')

            assert.equal(obj.interval, config.interval)
            assert.equal(obj.now, Math.floor(Date.now() / 1000))
            assert.equal(obj.head.length, 40)
            assert.equal(obj.peers.length, 1)
            assert.equal(obj.peers[0].peer_id, pid2)
            assert.notEqual(typeof(obj.peers[0].ip), undefined)
            assert.notEqual(obj.peers[0].ip, null)
            assert.equal(obj.peers[0].port, '2223')

            done()
        })
    })

    it('should give farewell to end', function (done) {
        fetch('peer_id=' + pid1 + '&port=2222&event=stopped', function (res) {
            var test = bencode.encode('bye')

            assert.equal(res.toString(), test.toString())

            done()
        })
    })

    it('should not recognize deleted peer', function (done) {
        fetch('peer_id=' + pid1 + '&port=2222', function (res) {
            var test = bencode.encode({failure_reason: 'Bad flow.'})

            assert.equal(res.toString(), test.toString())

            done()
        })
    })
})
