path = require('path')

module.exports.port     = 3000
module.exports.database = 'memory'

module.exports.interval = 120 // Second interval nodes should re-contact on.
module.exports.timeout  = 135 // If a node hasn't contacted in this many seconds, purge their record.

module.exports.defaultPeers = 10 // default number of peers to recommend
