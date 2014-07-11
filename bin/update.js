#! /usr/bin/env node

var request = require('request')
var db = require('../lib/db')
var JSONStream = require('JSONStream')
var es = require('event-stream')
var searchInfo = require('../lib/npm/search_info')
var easyFeatures = require('../lib/npm/easy_features')
var zmq = require('zmq')
var async = require('async')
var log = require('debug')('update')
var url = 'http://forum.atlantajavascript.com:5984/npm/_changes'
var ip = os.networkInterfaces().eth0[0].address
var push = zmq.socket('push')
push.bindSync('tcp://' + ip + ':3000')
var pull = zmq.socket('pull')
pull.bindSync('tcp://' + ip + ':3001')
var pending = {}

db(function(err, db){
  if (err) return console.error(err.message)

  var Modules = db.collection('modules2')
  var LastSeq = db.collection('last_seq')
  var q = async.cargo(function(results, done){
    var batch = Modules.initializeUnorderedBulkOp()
    for (var i = 0; i < results.length; i++){
      var result = results[i]
      batch.find({_id: result.name, version: result.version})
        .updateOne({
          $set: {
            testResults: result.testResults
          }
        })
    }
    log('saving batch of', results.length)
    batch.execute(function(err){
      log('saved batch of', results.length)
      var pendingArr = Object.keys(pending)
      if (pendingArr.length > 0){
        log(pendingArr.length, 'pending')
      }
      done()
    })
  })

  pull.on('message', function(msg){
    var result = JSON.parse('' + msg)
    log(msg.name, 'got result')
    delete pending[name]
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
            log(name, 'saving info')
            Modules.update(
              {_id: info.name, version: {$ne: version}},
              {$set: fields},
              {upsert: true},
              function(err, numModified){
                if (err){
                  log(name, err.message)
                }
                log(name, 'saved')
                if (numModified > 0){
                  pending[name] = true
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
      }))


    jsonStream.on('root', function(root){
      var lastSeq = root.last_seq
      console.log('Got last seq:', lastSeq)
      /*
      LastSeq.update(
        {_id: 1}, 
        {$set: {last_seq: lastSeq}}, 
        {upsert: true},
        function(err){
          if (err) console.error(err.message)
          else console.log('Updated last seq')
        }
      )*/
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