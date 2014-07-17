var exec = require('child_process').exec
var device = process.argv[2]

console.log('Disk usage for', device)

exec('df -k', function(err, stdout, stderr){
  var output = stdout + ''
  var line = output.split('\n').filter(function(line){
    return line.indexOf(device) === 0
  })[0]
  var parts = line.split(/\s+/)
  var available = Number(parts[3])
  console.log('Available space', available / 1000000)
})
