module.exports = coreDeps

var mdeps = require('module-deps')
var resolve = require('browser-resolve')
var path = require('path')
var dummyJs = path.join(__dirname, 'dummy.js')
var assert = require('assert')
var is = require('is-type')
var debug = require('debug')('core_deps')

var coreModules = {
 assert: dummyJs, 
 buffer: dummyJs, 
 child_process: dummyJs, 
 cluster: dummyJs, 
 console: dummyJs, 
 constants: dummyJs, 
 crypto: dummyJs, 
 dgram: dummyJs, 
 dns: dummyJs, 
 domain: dummyJs, 
 events: dummyJs, 
 fs: dummyJs, 
 http: dummyJs, 
 https: dummyJs, 
 module: dummyJs, 
 net: dummyJs, 
 os: dummyJs, 
 path: dummyJs, 
 punycode: dummyJs, 
 querystring: dummyJs, 
 readline: dummyJs, 
 repl: dummyJs, 
 stream: dummyJs, 
 _stream_duplex: dummyJs, 
 _stream_passthrough: dummyJs, 
 _stream_readable: dummyJs, 
 _stream_transform: dummyJs, 
 _stream_writable: dummyJs, 
 string_decoder: dummyJs, 
 sys: dummyJs, 
 timers: dummyJs, 
 tls: dummyJs, 
 tty: dummyJs, 
 url: dummyJs, 
 util: dummyJs, 
 vm: dummyJs, 
 zlib: dummyJs }


function coreDeps(file, callback){
  
  assert(is.string(file))
  assert(is.function(callback))

  debug('path', path)

  var opts = {
    resolve: resolve,
    modules: coreModules
  }

  var s = mdeps(file, opts)
  var coreDeps = {}

  s.on('data', function(obj){
    var deps = Object.keys(obj.deps)
    for (var i = 0; i < deps.length; i++){
      var dep = deps[i]
      if (dep in coreModules){
        coreDeps[deps[i]] = true
      }
    }
  })

  s.on('end', function(){
    callback(null, coreDeps)
  })

  s.on('error', function(err){
    callback(err)
  })

}
  