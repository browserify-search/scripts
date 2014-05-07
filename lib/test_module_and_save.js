var findOne = require('../lib/mongo/find_only_one')
var upsert = require('../lib/mongo/upsert')
var testModule = require('../lib/test_module')
var log = require('npmlog')

module.exports = function(db, module, next){
  var version = 4
  var modules = db.collection('modules')
  var dir = '/tmp/browserify-search'
  var startTime = +new Date
  log.info(module + ':', 'starting')
  testModule(module, dir, function(err, results){
    if (err){
      // this shouldn't happen
      log.error(module + ':', err.message)
      return next(err)
    }
    findOne(modules, {name: module}, function(err, mdoc){
      if (err){
        log.error(module + ':', err.message)
        return next(err)
      }
      mdoc.testResults = results;
      mdoc.testResults.version = version

      log.info(module + ':', results)
      upsert(modules, 'name', mdoc, function(err){
        if (err) return next(err)
        var endTime = +new Date
        log.info(module + ':', 'finished:', (endTime - startTime) + 'ms')
        next()
      })
    })
  })
}