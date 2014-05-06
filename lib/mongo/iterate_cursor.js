var queue = require('queue')
var assert = require('assert')
var is = require('is-type')

module.exports = function($1, $2, $3, $4){
  var cursor, fn, done, concurrency = 10

  if (arguments.length === 3){
    cursor = $1
    fn = $2
    done = $3
  }else if (arguments.length === 4){
    cursor = $1
    concurrency = $2
    assert(is.number(concurrency))
    fn = $3
    done = $4
  }else{
    throw new Error('Wrong number of arguments')
  }
  assert(is.object(cursor))
  assert(is.function(fn))
  assert(is.function(done))

  var q = queue({
    concurrency: concurrency
  })
  q.on('end', function(){
    done()
  })
  q.on('error', function(err){
    q.end(err)
    done(err)
  })
  cursor
    .each(function(err, item){
      if (err) return done(err)
      if (!item){
        q.start()
        return
      }
      q.push(function(callback){
        fn(item, callback)
      })
    })
}