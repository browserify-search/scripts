var spawn = require('child_process').spawn
var log = require('debug')('npm')
var path = require('path')
var mkdirp = require('mkdirp')
var assert = require('assert')
var is = require('is-type')

module.exports = function(module, dir, callback){
  log('installing')
  assert(is.string(module))
  assert(is.function(callback))

  var dirpath = path.join(dir, module)
  var cachepath = path.join(dirpath, 'cache')
  mkdirp(dirpath, function(err){
    if (err) return callback(err)

    var data = ''

    var npm = path.resolve('node_modules/.bin/npm')
    var p = spawn(npm, ['install', module], {
      cwd: dirpath
    })

    p.stdout.on('data', function(chunk){
      data += chunk
      log(chunk + '')
    })

    p.stderr.on('data', function(chunk){
      data += chunk
      log(chunk + '')
    })

    p.on('exit', function(code){
      callback(code ? new Error(data) : null)
    })

  })
}