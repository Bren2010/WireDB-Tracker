/**
* An example data layer for peers.  Just stores the information in memory.
*/
var config = require('config')
var Q      = require('q')

module.db = {}

/**
* Creates a new peer record.
*
* @param {String} pid  20-byte self-designated Peer ID.  Must be hexadecimal.
* @param {String} ip   Internet-wide address of peer.  IPv4, IPv6, or DNS name.
* @param {Number} port Peer's opened port for incoming connections.
*
* @return {Undefined} A real data layer might have a Promise here or something.
*/
module.exports.create = function (pid, ip, port) {
    var key = pid + ':' + ip + ':' + port
    if (module.db[key] != null) { return Q(false) }

    var timeoutId = setTimeout(module.exports.delete, config.timeout * 1000,
        pid, ip, port)

    module.db[key] = {
        peer_id: pid,
        ip: ip,
        port: port,
        timeout: timeoutId
    }

    return Q(true)
}

/**
* Resets the TTL of a peer record.  See above for documentation.
*/
module.exports.keepAlive = function(pid, ip, port) {
    var key = pid + ':' + ip + ':' + port
    if (module.db[key] == null) { return Q(false) }

    clearTimeout(module.db[key].timeout)
    var timeoutId = setTimeout(module.exports.delete, config.timeout * 1000,
        pid, ip, port)

    module.db[key].timeout = timeoutId

    return Q(true)
}

/**
* Goes through the database and finds some peers to recommend.
*
* @param {String} pid   20-byte self-designated Peer ID.  Must be hexadecimal.
* @param {Number} peers Number of peers the local peer is requesting.
*
* @return {Array}  Recommended peers.
*/
module.exports.recommend = function(pid, peers) {
    // Compile a list of relevant entries (to chose peers from).
    var relevant = [],
        recommend = []

    for (key in module.db) {
        if (module.db[key].peer_id != pid) {
            relevant.push(module.db[key])
        }
    }

    // Recommend a few peers randomly.
    relevant.sort(function() { return 0.5 - Math.random() })

    for (var i = 0; i < peers; ++i) {
        if (relevant[i] != null) {
            recommend.push({
                peer_id: relevant[i].peer_id,
                ip: relevant[i].ip,
                port: relevant[i].port
            })
        }
    }

    return Q([complete, incomplete, recommend])
}

/**
* Deletes a record of a peer. See above for documentation.
*/
module.exports.delete = function (pid, ip, port) {
    var key = pid + ':' + ip + ':' + port
    delete module.db[key]

    return Q(true)
}
