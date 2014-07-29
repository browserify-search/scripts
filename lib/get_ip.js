var os=require('os');

module.exports = function(){
  var ifaces=os.networkInterfaces()
  var ret
  for (var dev in ifaces) {
    if (dev === 'en0' || dev === 'eth0'){
      ifaces[dev].forEach(function(details){
        if (details.family=='IPv4') {
          ret = details.address
        }
      })
    }
  }
  return ret
}