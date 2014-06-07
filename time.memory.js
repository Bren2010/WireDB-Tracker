/**
* An example data layer for time.  Just retreives the system time.
*/
var Q = require('q')

/**
* Gets the current network-wide time.
*
* @return {Number} Unix timestmap.  A Promise could be here or something.
*/
module.exports.now = function () {
    return Q(Math.floor(Date.now() / 1000))
}
