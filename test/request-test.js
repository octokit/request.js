const chai = require('chai')
const getUserAgent = require('universal-user-agent')
const fetchMock = require('fetch-mock/es5/server')
const sinonChai = require('sinon-chai')

const octokitRequest = require('..')

chai.use(sinonChai)
const expect = chai.expect
const originalFetch = octokitRequest.fetch

const pkg = require('../package.json')
const userAgent = `octokit-request.js/${pkg.version} ${getUserAgent()}`

describe('octokitRequest()', () => {
  afterEach(() => {
    octokitRequest.fetch = originalFetch
  })
  it('is a function', () => {
    expect(octokitRequest).to.be.a('function')
  })

  it('README example', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .mock('https://api.github.com/orgs/octokit/repos?type=private', [], {
        headers: {
          accept: 'application/vnd.github.v3+json',
          authorization: 'token 0000000000000000000000000000000000000001',
          'user-agent': userAgent
        }
      })

    return octokitRequest('GET /orgs/:org/repos', {
      headers: {
        authorization: 'token 0000000000000000000000000000000000000001'
      },
      org: 'octokit',
      type: 'private'
    })

      .then(response => {
        expect(response.data).to.deep.equal([])
      })
  })

  it('README example alternative', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .mock('https://api.github.com/orgs/octokit/repos?type=private', [], {
        headers: {
          accept: 'application/vnd.github.v3+json',
          authorization: 'token 0000000000000000000000000000000000000001',
          'user-agent': userAgent
        }
      })

    octokitRequest.fetch = fetchMock.sandbox()
      .mock('https://api.github.com/orgs/octokit/repos?type=private', [])

    return octokitRequest({
      method: 'GET',
      url: '/orgs/:org/repos',
      headers: {
        authorization: 'token 0000000000000000000000000000000000000001'
      },
      org: 'octokit',
      type: 'private'
    })

      .then(response => {
        expect(response.data).to.deep.equal([])
      })
  })

  it('Request with body', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .mock('https://api.github.com/repos/octocat/hello-world/issues', 201, {
        headers: {
          'content-type': 'application/json; charset=utf-8'
        }
      })

    octokitRequest('POST /repos/:owner/:repo/issues', {
      owner: 'octocat',
      repo: 'hello-world',
      headers: {
        accept: 'text/html;charset=utf-8'
      },
      title: 'Found a bug',
      body: "I'm having a problem with this.",
      assignees: [
        'octocat'
      ],
      milestone: 1,
      labels: [
        'bug'
      ]
    })

      .then(response => {
        expect(response.status).to.equal(201)
      })
  })

  it('Put without request body', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .mock('https://api.github.com/user/starred/octocat/hello-world', 204, {
        headers: {
          'content-length': 0
        }
      })

    octokitRequest('PUT /user/starred/:owner/:repo', {
      headers: {
        authorization: `token 0000000000000000000000000000000000000001`
      },
      owner: 'octocat',
      repo: 'hello-world'
    })

      .then(response => {
        expect(response.status).to.equal(204)
      })
  })

  it('HEAD requests (octokit/rest.js#841)', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .head('https://api.github.com/repos/whatwg/html/pulls/1', {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': 19137
        }
      })
      .head('https://api.github.com/repos/whatwg/html/pulls/2', {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': 120
        }
      })

    const options = {
      owner: 'whatwg',
      repo: 'html',
      number: 1
    }

    octokitRequest(`HEAD /repos/:owner/:repo/pulls/:number`, options)

      .then(response => {
        expect(response.status).to.equal(200)

        return octokitRequest(`HEAD /repos/:owner/:repo/pulls/:number`, Object.assign(options, { number: 2 }))
      })

      .then(() => {
        throw new Error('should not resolve')
      })

      .catch(error => {
        expect(error.code).to.equal(404)
      })
  })

  it.skip('Binary response with redirect (🤔 unclear how to mock fetch redirect properly)', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .get('https://codeload.github.com/octokit-fixture-org/get-archive/legacy.tar.gz/master', {
        status: 200,
        body: Buffer.from('1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000', 'hex'),
        headers: {
          'content-type': 'application/x-gzip',
          'content-length': 172
        }
      })

    return octokitRequest('GET /repos/:owner/:repo/:archive_format/:ref', {
      owner: 'octokit-fixture-org',
      repo: 'get-archive',
      archive_format: 'tarball',
      ref: 'master'
    })

      .then(response => {
        expect(response.data.length).to.equal(172)
      })
  })

  // TODO: fails with "response.buffer is not a function" in browser
  if (!process.browser) {
    it('Binary response', () => {
      octokitRequest.fetch = fetchMock.sandbox()
        .get('https://codeload.github.com/octokit-fixture-org/get-archive/legacy.tar.gz/master', {
          status: 200,

          // expect(response.data.length).to.equal(172)
          // body: Buffer.from('1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000', 'hex'),
          body: Buffer.from('1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000', 'hex'),
          headers: {
            'content-type': 'application/x-gzip',
            'content-length': 172
          }
        })

      return octokitRequest('GET https://codeload.github.com/octokit-fixture-org/get-archive/legacy.tar.gz/master')
    })
  }

  it('304 etag', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .get((url, { headers }) => {
        return url === 'https://api.github.com/orgs/myorg' &&
               headers['if-none-match'] === 'etag'
      }, 304)

    return octokitRequest('GET /orgs/:org', {
      org: 'myorg',
      headers: { 'If-None-Match': 'etag' }
    })

      .then(() => {
        throw new Error('should not resolve')
      })

      .catch(error => {
        expect(error.code).to.equal(304)
      })
  })

  it('Not found', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .get('path:/orgs/nope', 404)

    return octokitRequest('GET /orgs/:org', {
      org: 'nope'
    })

      .then(() => {
        throw new Error('should not resolve')
      })

      .catch(error => {
        expect(error.code).to.equal(404)
      })
  })

  it('non-JSON response', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .get('path:/repos/octokit-fixture-org/hello-world/contents/README.md', {
        status: 200,
        body: '# hello-world',
        headers: {
          'content-length': 13,
          'content-type': 'application/vnd.github.v3.raw; charset=utf-8'
        }
      })

    return octokitRequest('GET /repos/:owner/:repo/contents/:path', {
      headers: {
        accept: 'application/vnd.github.v3.raw'
      },
      owner: 'octokit-fixture-org',
      repo: 'hello-world',
      path: 'README.md'
    })

      .then((response) => {
        expect(response.data).to.equal('# hello-world')
      })
  })

  if (!process.browser) {
    it('Request error', () => {
      // port: 8 // officially unassigned port. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
      return octokitRequest('GET https://127.0.0.1:8/')

        .then(() => {
          throw new Error('should not resolve')
        })

        .catch(error => {
          expect(error.code).to.equal(500)
        })
    })
  }

  it('custom user-agent', () => {
    octokitRequest.fetch = fetchMock.sandbox()
      .get((url, { headers }) => headers['user-agent'] === 'funky boom boom pow', 200)

    return octokitRequest('GET /', {
      headers: {
        'user-agent': 'funky boom boom pow'
      }
    })
  })
})
