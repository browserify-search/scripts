var install = require('./npm_install')
var testBrowserify = require('./test_browserify')
var debug = require('debug')('test_module')
var assert = require('assert')
var path = require('path')
var is = require('is-type')
var coreDeps = require('./core_deps')

module.exports = function testModule(module, dir, callback){
  assert(is.string(module))
  assert(is.string(dir))
  assert(is.function(callback))
  
  var results = {
    install: {},
    browserify: {},
    coreDeps: null
  }

  install(module, dir, function(err){
    if (err) {
      results.install.passed = false
      results.install.error = err.message
      return callback(null, results)
    }else{
      results.install.passed = true
    }
    
    testBrowserify(module, dir, function(err){
      if (err) {
        results.browserify.passed = false
        results.browserify.error = err.message
      }else{
        results.browserify.passed = true
      }

      coreDeps(path.join(dir, module, 'node_modules', module), function(err, deps){
        if (err){
          return callback(err) // this shouldn't happen
        }
        results.coreDeps = deps
        callback(null, results)
      })
    });
    
  });
}