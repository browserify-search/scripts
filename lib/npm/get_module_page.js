var assert = require('assert')
var is = require('is-type')
var request = require('superagent')

module.exports = function(module, callback){
  assert(is.string(module))

  request('https://www.npmjs.org/package/' + module)
    .end(function(err, resp){
      if (err) return callback(err)
      if (resp.error) return callback(resp.error)
      callback(null, resp.text)
    })

}