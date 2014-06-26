var assert = require('assert')
var is = require('is-type')
var request = require('superagent')

module.exports = function(module, callback){
  assert(is.string(module))
  assert(is.function(callback))
  
  request.get('https://registry.npmjs.org/' + module)
    .end(function(err, resp){
      if (err) return callback(err)
      if (resp.error) return callback(resp.error)
      assert(resp.body, 'should have a response??')
      callback(null, resp.body)
    })
}