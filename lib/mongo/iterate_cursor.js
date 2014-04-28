var queue = require('queue')

module.exports = function(cursor, fn, done){
  var q = queue({
    concurrency: 40
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