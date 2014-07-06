#! /usr/bin/env node

var fs = require('fs')

fs.readFile('./data/timeline.txt', function(err, data){
  data = '' + data
  var lastValue = 0
  data.split('\n').forEach(function(line){
    var value = line.split(',').map(function(part){
      return Number(part.trim())
    })[0]
    var diff = value - lastValue
    console.log(diff)
    lastValue = value
  })
})