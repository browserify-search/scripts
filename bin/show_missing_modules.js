#! /usr/bin/env node

var fs = require('fs')

var dirs = fs.readdirSync('/var/www/npm')
var installedModules = {}
dirs.forEach(function(module){
  installedModules[module] = true
})

var changes = require('../changes.json')

changes.results.forEach(function(result){
  var module = result.id
  if (!(module in installedModules)){
    console.log(result.seq, module)
  }
})
