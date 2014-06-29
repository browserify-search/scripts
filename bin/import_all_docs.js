#! /usr/bin/env node

var request = require('request')
var JSONStream = require('JSONStream')
var es = require('event-stream')
var async = require('async')
var db = require('../lib/db')
var searchInfo = require('../lib/npm/search_info')
var easyFeatures = require('../lib/npm/easy_features')

var stream = JSONStream.parse(['rows', true, 'doc'])
var numValid = 0
var numInvalid = 0
var totalProcessed = 0

db(function(err, db){
  if (err) return console.error(err.message)
  var Modules = db.collection('modules3')

  var q = async.cargo(function(docs, done){
    var start = +new Date
    var batch = Modules.initializeUnorderedBulkOp()
    for (var i = 0; i < docs.length; i++){
      batch.insert(docs[i])
    }

    batch.execute(function(err){
      var end = +new Date
      console.log('Batch of', docs.length, 'inserted in', (end - start) + 'ms')
      process.stdout.write('.')
      done(err)
    })
  })

  request('http://forum.atlantajavascript.com:5984/npm/_all_docs?include_docs=true')
    .pipe(JSONStream.parse('rows.*.doc'))
    .pipe(es.mapSync(function(data){
      if (!isValid(data)){
        numInvalid++
        return console.warn('Invalid package', data.name)
      }
      var search = searchInfo(data)
      var features = easyFeatures(data)
      var doc = {
        name: data.name,
        search: search,
        features: features
      }
      numValid++
      q.push(doc)
    }))
})

function isValid(pkg){
  var tags = pkg['dist-tags']
  if (!tags) return false
  var latest = tags.latest
  if (!latest) return false
  if (!pkg.versions[latest]) return false
  return true
}