var jsdom = require('jsdom')
var assert = require('assert')
var is = require('is-type')
var log = require('debug')('browserify:test')

module.exports = function(code, callback){
  assert(is.string(code))
  assert(is.function(callback))

  jsdom.env({
    html: '<html><head></head><body><div></div></body></html>',
    src: [String(code)],
    done: function(errs, window){
      window.close()
      if (errs){
        var err = errs[0]
        log('failed with', err)
        return callback(err)
      }else{
        log('worked!')
        callback()
      }
    }
  })

}
