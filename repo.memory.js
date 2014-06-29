/**
* An example data layer for the repo.  Just stores the information in memory and
* gets updates from authenticated nodes via a file.
*/
var config = require('config')
var fs     = require('fs')
var Q      = require('q')

var loc = './../head.txt'
var head = '0000000000000000000000000000000000000000'

if (!fs.existsSync(loc)) {
    fs.writeFileSync(loc, '0000000000000000000000000000000000000000')
}

var head = fs.readFileSync(loc).toString()

fs.watchFile(loc, function () {
    head = fs.readFileSync(loc).toString()
})

module.exports.head = function () {
    return Q(head)
}
