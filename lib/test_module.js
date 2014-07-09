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
    startTime: null,
    duration: null,
    install: {

    },
    browserify: {
      bundle: {
        duration: null
      }, test: {

      }
    },
    coreDeps: null
  }

  var start = results.startTime = +new Date
  install(module, dir, function(err){
    var duration = (+new Date) - start
    results.install.duration = duration
    debug(module, 'Install time', duration, 'ms')
    if (err){
      results.install.passed = false
      results.install.error = err.message
      return finish()
    }else{
      results.install.passed = true
    }

    start = +new Date
    bundle(module, dir, function(err, code){
      var duration = (+new Date) - start
      results.browserify.bundle.duration = duration
      debug(module, 'Bundle time', duration, 'ms')
      start = +new Date
      results.browserify.bundle.passed = !err
      if (err){
        results.browserify.bundle.error = err.message
        return finish()
      }

      /*
      test(code, function(err){
        debug(module, 'Test time', (+new Date) - start, 'ms')
        start = +new Date
        results.browserify.test.passed = !err
        if (err){
          results.browserify.test.error = err.message
        }*/

      start = + new Date
      coreDeps(path.join(dir, module, 'node_modules', module.split('@')[0]), function(err, deps){
        var duration = (+new Date) - start
        debug(module, 'Core deps time', duration, 'ms')
        if (err){
          // this shouldn't happen
          results.coreDeps = {
            error: err.message,
            duration: duration
          }
        }else{
          results.coreDeps = deps
          deps.duration = duration
        }
        results.duration = (+ new Date) - results.startTime
        finish()
      })
    })

    
  })

  function finish(){
    callback(null, results)
  }

}