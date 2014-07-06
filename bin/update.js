#! /usr/bin/env node

var request = require('request')
var db = require('../lib/db')
var JSONStream = require('JSONStream')
var es = require('event-stream')
var searchInfo = require('../lib/npm/search_info')
var easyFeatures = require('../lib/npm/easy_features')
var zmq = require('zmq')
var async = require('async')
var url = 'http://forum.atlantajavascript.com:5984/npm/_changes'
var ip = os.networkInterfaces().eth0[0].address
var push = zmq.socket('push')
push.bindSync('tcp://' + ip + ':3000')
var pull = zmq.socket('pull')
pull.bindSync('tcp://' + ip + ':3001')

db(function(err, db){
  if (err) return console.error(err.message)

  var Modules = db.collection('modules2')
  var LastSeq = db.collection('last_seq')
  var q = async.cargo(function(results, done){
    var batch = Modules.initializeUnorderedBulkOp()
    for (var i = 0; i < results.length; i++){
      var result = results[i]
      batch.find({_id: result.name, result.version})
        .updateOne({
          $set: {
            testResults: result.testResults
          }
        })
    }
    var start = + new Date
    batch.execute(function(err){
      var end = + new Date
      var duration = end - start
      console.log('Batch update', results.length,
        'documents took', duration + 'ms')
      done()
    })
  })

  pull.on('message', function(msg){
    var result = JSON.parse('' + msg)
    q.push(result)
  })

  LastSeq.findOne({_id: 1}, function(err, lastSeqDoc){
    var lastSeq = lastSeqDoc.last_seq

    var jsonStream = JSONStream.parse('results.*.doc')
    var req = request(url + '?since=' + lastSeq)
    req.pipe(jsonStream)
      .pipe(es.mapSync(function(info){
        if (info._id.substring(0, 8) !== '_design/'){
          if (isValid(info)){
            var search = searchInfo(info)
            var features = easyFeatures(info)
            var version = info.version
            var name = info.name
            var fields = {
              version: version,
              search: search,
              features: features
            }
            Modules.update(
              {_id: info.name, version: {$ne: version}},
              {$set: fields},
              {upsert: true},
              function(err, numModified){
                if (err){
                  console.error(err.message)
                }
                if (numModified > 0){
                  push.send(JSON.stringify({
                    command: 'test',
                    module: name,
                    version: version
                  }))
                }
              }
            )
          }
        }
      })

    jsonStream.on('root', function(root){
      var lastSeq = root.last_seq
      LastSeq.update(
        {_id: 1}, 
        {$set: {last_seq: lastSeq}}, 
        {upsert: true},
        function(err){
          if (err) console.error(err.message)
          else console.log('Updated last seq')
        }
      )
    })
  })
})

function isValid(pkg){
  var tags = pkg['dist-tags']
  if (!tags) return false
  var latest = tags.latest
  if (!latest) return false
  if (!pkg.versions[latest]) return false
  return true
}