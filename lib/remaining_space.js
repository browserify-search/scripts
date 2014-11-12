var exec = require('child_process').exec
var df = require('node-diskfree')

module.exports = remainingSpace

function remainingSpace(mountLocation, callback){
  getDriveForMount(mountLocation, function(err, drive){
    if (err) return callback(err)
    df.driveDetail(drive.name, function(err, detail){
      if (err) return callback(err)
      callback(null, parseSize(detail.available))
    })
  })
}

function parseSize(str){
  var m = str.match(/^([0-9]+\.[0-9]+) (GB|MB|KB)$/)
  if (!m) throw new Error('Unable to parse size: "' + str + '"')
  var value = Number(m[1])
  var unit = m[2]
  if (unit === 'GB'){
    return value * 1000000000
  }else if (unit === 'MB'){
    return value * 1000000
  }else if (unit === 'KB'){
    return value * 1000
  }else{
    return value
  }
}

function getDriveForMount(location, callback){
  exec('mount', function(err, stdout, stderr){
    if (err){
      return callback(err)
    }
    var mounts = parseMounts(stdout)
    var drive = mounts.filter(function(mount){
      return mount.location === location
    })[0]
    callback(null, drive)
  })
}

function parseMounts(stdout){
  var lines = stdout.split('\n')
  return lines.map(function(line){
    var m = line.match(/^([a-zA-Z0-9-_\/ ]+) on ([a-zA-Z0-9\/]+) \((.*)\)$/)
    if (!m) return null
    return {
      name: m[1],
      location: m[2],
      options: m[3].split(', ')
    }
  }).filter(function(m){ return m })
}