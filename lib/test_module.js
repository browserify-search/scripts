var install = require('./npm_install')
var assert = require('assert')
var path = require('path')
var is = require('is-type')
var coreDeps = require('core-deps')
var bundle = require('./browserify_bundle')
var test = require('./browserify_test')
var rimraf = require('rimraf')
var debug = require('debug')('test_module')

module.exports = function testModule(module, dir, callback){
  assert(is.string(module))
  assert(is.string(dir))
  assert(is.function(callback))
  var timeMeasurements = {}
  var start, startAll

  startAll = start = +new Date
  var results = {
    install: {},
    browserify: {
      bundle: {}, 
      test: {}
    },
    coreDeps: null
  }

  install(module, dir, function(err){
    timeMeasurements.install = new Date - start
    if (err){
      results.install.passed = false
      results.install.error = err.message
      return finish()
    }else{
      results.install.passed = true
    }

    start = +new Date
    bundle(module, dir, function(err, code){
      timeMeasurements.bundle = new Date - start
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
        timeMeasurements.coreDeps = new Date - start
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

  function finish(){
    timeMeasurements.testModule = new Date - startAll
    callback(null, results, timeMeasurements)
  }

}