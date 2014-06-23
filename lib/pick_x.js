
module.exports = function pickX(arr, x){
  x = x || 10
  var ret = []
  for (var i = 0; i < x; i++){
    var idx = Math.floor(Math.random() * arr.length)
    ret.push(arr[idx])
  }
  return ret
}