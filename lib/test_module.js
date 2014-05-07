var install = require('./npm_install')
var assert = require('assert')
var path = require('path')
var is = require('is-type')
var coreDeps = require('./core_deps')
var bundle = require('./browserify_bundle')
var test = require('./browserify_test')
var rimraf = require('rimraf')
var debug = require('debug')('test_module')

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

  var start = +new Date
  install(module, dir, function(err){
    debug(module, 'Install time', (+new Date) - start, 'ms')
    start = +new Date
    if (err){
      results.install.passed = false
      results.install.error = err.message
      return finish()
    }else{
      results.install.passed = true
    }
    
    finish()

    /*
    bundle(module, dir, function(err, code){
      debug(module, 'Bundle time', (+new Date) - start, 'ms')
      start = +new Date
      results.browserify.bundle.passed = !err
      if (err){
        results.browserify.bundle.error = err.message
        return finish()
      }

      test(code, function(err){
        debug(module, 'Test time', (+new Date) - start, 'ms')
        start = +new Date
        results.browserify.test.passed = !err
        if (err){
          results.browserify.test.error = err.message
          return finish()
        }

        coreDeps(path.join(dir, module, 'node_modules', module), function(err, deps){
          debug(module, 'Core deps time', (+new Date) - start, 'ms')
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
*/
    
  })

  function finish(){
    /*rimraf(path.join(dir, module), function(err){
      if (err) log.warn(module + ':', err.message)
      callback(null, results)
    })*/
    callback(null, results)
  }

}