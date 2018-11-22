const chai = require('chai')
const fetchMock = require('fetch-mock/es5/server')

const octokitRequest = require('..')
const mockable = require('../lib/fetch')

const expect = chai.expect

describe('endpoint.defaults()', () => {
  it('is a function', () => {
    expect(octokitRequest.defaults).to.be.a('function')
  })

  it('README example', () => {
    mockable.fetch = fetchMock.sandbox()
      .mock('https://github-enterprise.acme-inc.com/api/v3/orgs/my-project/repos?per_page=100', [], {
        headers: {
          accept: 'application/vnd.github.v3+json',
          authorization: 'token 0000000000000000000000000000000000000001',
          'user-agent': 'myApp/1.2.3'
        }
      })

    const myRequest = octokitRequest.defaults({
      baseUrl: 'https://github-enterprise.acme-inc.com/api/v3',
      headers: {
        'user-agent': 'myApp/1.2.3',
        authorization: `token 0000000000000000000000000000000000000001`
      },
      org: 'my-project',
      per_page: 100
    })

    return myRequest(`GET /orgs/:org/repos`)

      .then(response => {
        expect(response.status).to.equal(200)
      })
  })

  it('repeated defaults', () => {
    mockable.fetch = fetchMock.sandbox()
      .get('https://github-enterprise.acme-inc.com/api/v3/orgs/my-project/repos', [], {
        headers: {
          accept: 'application/vnd.github.v3+json',
          authorization: 'token 0000000000000000000000000000000000000001',
          'user-agent': 'myApp/1.2.3'
        }
      })

    const myProjectRequest = octokitRequest.defaults({
      baseUrl: 'https://github-enterprise.acme-inc.com/api/v3',
      headers: {
        'user-agent': 'myApp/1.2.3'
      },
      org: 'my-project'
    })
    const myProjectRequestWithAuth = myProjectRequest.defaults({
      headers: {
        authorization: `token 0000000000000000000000000000000000000001`
      }
    })

    return myProjectRequestWithAuth(`GET /orgs/:org/repos`)

      .then(response => {
        expect(response.status).to.equal(200)
      })
  })
})
