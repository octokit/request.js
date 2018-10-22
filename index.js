module.exports = restRequest

const restEndpoint = require('@octokit/endpoint')
const fetch = require('node-fetch').default

const request = require('./lib/request')

const getUserAgent = require('universal-user-agent')

const version = require('./package.json').version
const userAgent = `octokit-request.js/${version} ${getUserAgent()}`

function restRequest (route, options) {
  const requestOptions = restEndpoint.apply(null, arguments)

  // override the default user-agent header set by @octokit/endpoit
  if (/^octokit-endpoint.js/.test(requestOptions.headers['user-agent'])) {
    requestOptions.headers['user-agent'] = userAgent
  }

  return request(module.exports.fetch, requestOptions)
}

// expose internally used `fetch` method for testing/mocking only
module.exports.fetch = fetch
