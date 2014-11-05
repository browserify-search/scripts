exports.get = getLastSeq
function getLastSeq(db, callback){
  var LastSeq = db.collection('last_seq')
  LastSeq.findOne({_id: 1}, function(err, lastSeqDoc){
    if (err) return callback(err)
    var lastSeq = lastSeqDoc && lastSeqDoc.last_seq
    callback(null, lastSeq)
  })
}

exports.set = saveLastSeq
function saveLastSeq(db, lastSeq, callback){
  var LastSeq = db.collection('last_seq')
  LastSeq.update(
    {_id: 1}, 
    {$set: {last_seq: lastSeq}}, 
    {upsert: true},
    callback || function(){}
  )
}