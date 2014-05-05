
module.exports = function pick10(arr){
  var ret = []
  for (var i = 0; i < 10; i++){
    var idx = Math.floor(Math.random() * arr.length)
    ret.push(arr[idx])
  }
  return ret
}