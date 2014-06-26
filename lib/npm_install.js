var execFile = require('child_process').execFile
var log = require('debug')('npm')
var path = require('path')
var mkdirp = require('mkdirp')
var assert = require('assert')
var is = require('is-type')
var fs = require('fs')
var rimraf = require('rimraf')

module.exports = function(module, dir, callback){
  log('installing')
  assert(is.string(module))
  assert(is.function(callback))

  var dirpath = path.join(dir, module)
  var cachepath = path.join(dirpath, 'cache')
  var timeout = 50000
  var startTime = +new Date

  fs.exists(dirpath, function(yes){
    if (yes){
      rimraf(dirpath, function(err){
        if (err) return callback(err)
        console.log('removed', dirpath)
        doit()
      })
    }else{
      doit()
    }

    function doit(){
      mkdirp(dirpath, function(err){
        if (err) return callback(err)

        var data = ''

        var npm = path.resolve('node_modules/.bin/npm')
        var p = execFile(npm, ['install', module], {
          cwd: dirpath,
          timeout: timeout
        })

        p.stdout.on('data', function(chunk){
          data += chunk
          log(chunk + '')
        })

        p.stderr.on('data', function(chunk){
          data += chunk
          log(chunk + '')
        })

        p.on('close', function(code){
          var endTime = +new Date
          var duration = endTime - startTime
          if (code){
            var msg = data
            if (duration >= timeout){
              msg = '[' + duration + 'ms] - ' + msg
            }
            return callback(new Error(msg))
          }else{
            return callback()
          }
        })
      })
    }
  })
}