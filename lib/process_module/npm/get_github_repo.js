module.exports = getRepo

var is = require('is-type')

var RepoRegexps = [
  /^(?:git\:)?(?:git\@)?github\.com(?:\:|\/)([a-zA-Z0-9][a-zA-Z0-9\-]+)\/([a-zA-Z0-9\-\_\.]+)(?:\.git)?$/,
  /^(?:git|https|http)\:\/\/(?:[a-zA-Z0-9][a-zA-Z0-9\-]+\@)?github\.com[\:\/]([a-zA-Z0-9][a-zA-Z0-9\-]+)\/([a-zA-Z0-9\-\_\.]+)(?:\.git)?$/,
  /^([a-zA-Z0-9][a-zA-Z0-9\-]+)\/([a-zA-Z0-9\-\_\.]+)$/,
  
]

function getRepo(info){
  if (!info.repository) return null
  var url = info.repository.url
  if (!is.string(url)){
    return null
  }
  for (var i = 0; i < RepoRegexps.length; i++){
    var reg = RepoRegexps[i]
    var m = url.match(reg)
    if (m){
      var repo = m[1] + '/' + m[2]
      if (repo.match(/\.git$/)){
        repo = repo.substring(0, repo.length - 4)
      }
      return repo
    }
  }
}