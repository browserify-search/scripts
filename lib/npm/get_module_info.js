var assert = require('assert')
var is = require('is-type')
var request = require('superagent')

module.exports = function(module, callback){
  assert(is.string(module))
  assert(is.function(callback))
  
  request.get('http://forum.atlantajavascript.com:5984/npm/' + module)
    .end(function(err, resp){
      err = err || resp.error
      if (err) return callback(err)
      var body = JSON.parse(resp.text)
      callback(null, body)
    })
}