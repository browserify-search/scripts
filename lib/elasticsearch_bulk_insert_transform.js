
module.exports = function(dist, input, output){
  input.on('data', function(module){
    if (module.invalid) return
    if (module.testResults && !module.testResults.browserify.bundle.passed) return
    if (typeof module.search.readme !== 'string'){
      module.search.readme = ''
    }
    var cdf = dist.cdf(module.downloadsLastMonth.count)
    module.downloadsLastMonth.cdf = cdf
    output.write(JSON.stringify({
      create: {
        _id: module._id
      }
    }) + '\n')
    output.write(JSON.stringify(module) + '\n')
  })
}
  