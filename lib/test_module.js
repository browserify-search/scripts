var install = require('./npm_install')
var assert = require('assert')
var path = require('path')
var is = require('is-type')
var coreDeps = require('./core_deps')
var bundle = require('./browserify_bundle')
var test = require('./browserify_test')
var rimraf = require('rimraf')
var log = require('npmlog')

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
      return finish()
    }else{
      results.install.passed = true
    }
    
    bundle(module, dir, function(err, code){
      results.browserify.bundle.passed = !err
      if (err){
        results.browserify.bundle.error = err.message
        return finish()
      }

      test(code, function(err){
        results.browserify.test.passed = !err
        if (err){
          results.browserify.test.error = err.message
          return finish()
        }

        coreDeps(path.join(dir, module, 'node_modules', module), function(err, deps){
          if (err){
            // this shouldn't happen
            results.coreDeps = {
              error: err.message
            }
          }else{
            results.coreDeps = deps
          }

          finish()
        })
      })
    })
    
  })

  function finish(){
    rimraf(path.join(dir, module), function(err){
      if (err) log.warn(module + ':', err.message)
      callback(null, results)
    })
  }

}