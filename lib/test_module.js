var install = require('./npm_install')
var debug = require('debug')('test_module')
var assert = require('assert')
var path = require('path')
var is = require('is-type')
var coreDeps = require('./core_deps')
var bundle = require('./browserify_bundle')
var test = require('./browserify_test')

module.exports = function testModule(module, dir, callback){
  assert(is.string(module))
  assert(is.string(dir))
  assert(is.function(callback))
  
  var results = {
    install: {},
    browserify: {
      bundle: {},
      test: {}
    },
    coreDeps: null
  }

  install(module, dir, function(err){
    if (err){
      results.install.passed = false
      results.install.error = err.message
      return callback(null, results)
    }else{
      results.install.passed = true
    }
    
    bundle(module, dir, function(err, code){
      results.browserify.bundle.passed = !err
      if (err){
        results.browserify.bundle.error = err.message
        return callback(null, results)
      }

      test(code, function(err){
        results.browserify.test.passed = !err
        if (err){
          results.browserify.test.error = err.message
          return callback(null, results)
        }

        coreDeps(path.join(dir, module, 'node_modules', module), function(err, deps){
          if (err){
            return callback(err) // this shouldn't happen
          }
          results.coreDeps = deps
          callback(null, results)
        })
      })
    })
    
  })
}