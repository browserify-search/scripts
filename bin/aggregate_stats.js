#! /usr/bin/env node

var async = require('async')
var db = require('../lib/db')

db(function(err, db){
  var props = [
    'downloadsLastMonth.count'
  ]
  async.mapSeries(props, function(prop, next){
    mapReduce(db, prop, next)
  }, function(err, results){
    if (err) return console.error(err.message)
    console.log('results', results)
    var allStats = mergeResults(results)
    console.log(allStats)
    var moduleStats = db.collection('moduleStats')
    moduleStats.update({}, allStats, {upsert: true}, 
      function(err){
        if (err) {
          console.error(err)
          db.close()
          return
        }
        console.log('Updated moduleStats')
        db.close()
      })
  })
})

function mergeResults(results){
  var allStats = {}
  for (var i = 0; i < results.length; i++){
    var result = results[i]
    allStats[result.property] = {
      avg: result.avg,
      variance: result.variance,
      stddev: result.stddev
    }
  }
  return allStats
}

function mapReduce(db, prop, callback){
  var modules = db.collection('modules')
  modules.mapReduce(
    map(prop),
    reduce,
    {
      query: {'testResults.browserify.bundle.passed': true},
      finalize: finalize,
      out: { inline: 1 }
    },
    function(err, results){
      if (err) return callback(err)
      var result = results[0].value
      result.property = prop
      callback(null, result)
    }
  )
}

// Adapted from <https://gist.github.com/RedBeard0531/1886960>

function map(prop){
  return "function map() {\
    var value = this." + prop + ";\n\
    emit(1, {\n\
      sum: value,\n\
      min: value,\n\
      max: value,\n\
      count:1,\n\
      diff: 0\n\
    })\
  }"
}

function reduce(key, values) {
  var a = values[0]
  for (var i=1; i < values.length; i++){
    var b = values[i]

    var delta = a.sum/a.count - b.sum/b.count
    var weight = (a.count * b.count)/(a.count + b.count)
    
    a.diff += b.diff + delta*delta*weight
    a.sum += b.sum
    a.count += b.count
    a.min = Math.min(a.min, b.min)
    a.max = Math.max(a.max, b.max)
  }

  return a
}
 
function finalize(key, value){ 
  value.avg = value.sum / value.count
  value.variance = value.diff / value.count
  value.stddev = Math.sqrt(value.variance)
  return value
}
