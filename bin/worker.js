#! /usr/bin/env node

var zmq = require('zmq')
var async = require('async')
var db = require('../lib/db')
var pull = zmq.socket('pull')
var push = zmq.socket('push')
var ip = '199.116.112.230'
var testModule = require('../lib/test_module')
var dir = '/tmp/browserify-search'
var getModuleInfo = require('../lib/npm/get_module_info')
var searchInfo = require('../lib/npm/search_info')
var easyFeatures = require('../lib/npm/easy_features')
var debug = require('debug')('worker')

pull.connect('tcp://' + ip + ':3000')
push.connect('tcp://' + ip + ':3001')

db(function(err, db){
  if (err) return console.error(err.message)
  var Modules = db.collection('modules2')

  var q = async.queue(function(module, done){
    processModule(module, done)
  }, 2)

  pull.on('message', function(msg){
    q.push(msg.toString())
  })

  function processModule(module, done){
    getModuleInfo(module, function(err, info){
      if (err) return done(err)

      if (!isValid(info)){
        push.send(
          JSON.stringify({
            _id: module,
            invalid: true
          })
        )
        return done()
      }
      var version = info['dist-tags'].latest
      var search = searchInfo(info)
      var features = easyFeatures(info)
      testModule(module, dir, function(err, results){
        if (err){
          console.error(module, err.message)
          done()
          return
        }
        push.send(
          JSON.stringify({
            _id: module, 
            version: version,
            search: search,
            features: features,
            testResults: results
          })
        )
        done()
      })
    })
  }

})

function isValid(pkg){
  var tags = pkg['dist-tags']
  if (!tags) return false
  var latest = tags.latest
  if (!latest) return false
  if (!pkg.versions[latest]) return false
  return true
}
