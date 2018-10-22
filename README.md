# request.js

> Send parameterized requests to GitHub’s APIs with sensible defaults in browsers and Node

[![@latest](https://img.shields.io/npm/v/@octokit/request.svg)](https://www.npmjs.com/package/@octokit/request)
[![Build Status](https://travis-ci.org/octokit/request.js.svg?branch=master)](https://travis-ci.org/octokit/request.js)
[![Coverage Status](https://coveralls.io/repos/github/octokit/request.js/badge.svg)](https://coveralls.io/github/octokit/request.js)
[![Greenkeeper](https://badges.greenkeeper.io/octokit/request.js.svg)](https://greenkeeper.io/)

`@octokit/request` is a request library for browsers & node that makes it easier
to interact with [GitHub’s REST API](https://developer.github.com/v3/) and
[GitHub’s GraphQL API](https://developer.github.com/v4/guides/forming-calls/#the-graphql-endpoint).

It uses [`@octokit/endpoint`](https://github.com/octokit/endpoint.js) to parse
the passed options and sends the request using [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 ([node-fetch](https://github.com/bitinn/node-fetch) in Node).

## Usage

### Node

Install with `npm install @octokit/request`.

```js
const octokitRequest = require('@octokit/request')
```

### Browser

1. Download `octokit-request.min.js` from the latest release: https://github.com/octokit/request.js/releases

2. Load it as script into your web application:

   ```html
   <script src="request-rest.min.js"></script>
   ```

3. The `octokitRequest` is now available

### REST API example

```js
// Following GitHub docs formatting:
// https://developer.github.com/v3/repos/#list-organization-repositories
const result = await octokitRequest('GET /orgs/:org/repos', {
  headers: {
    authorization: 'token 0000000000000000000000000000000000000001'
  },
  org: 'octokit',
  type: 'private'
})

console.log(`${result.data.length} repos found.`)
```

### GraphQL example

```js
const result = await octokitRequest('POST /graphql', {
  headers: {
    authorization: 'token 0000000000000000000000000000000000000001'
  },
  query: `query ($login: String!) {
    organization(login: $login) {
      repositories(privacy: PRIVATE) {
        totalCount
      }
    }
  }`,
  variables: {
    login: 'octokit'
  }
})
```

### Alternative: pass `method` & `url` as part of options

Alternatively, pass in a method and a url

```js
const result = await octokitRequest({
  method: 'GET',
  url: '/orgs/:org/repos',
  headers: {
    authorization: 'token 0000000000000000000000000000000000000001'
  },
  org: 'octokit',
  type: 'private'
})
```

## Options

<table>
  <thead>
    <tr>
      <th align=left>
        name
      </th>
      <th align=left>
        type
      </th>
      <th align=left>
        description
      </th>
    </tr>
  </thead>
  <tr>
    <th align=left>
      <code>baseUrl</code>
    </th>
    <td>
      String
    </td>
    <td>
      <strong>Required.</strong> Any supported <a href="https://developer.github.com/v3/#http-verbs">http verb</a>, case insensitive. <em>Defaults to <code>https://api.github.com</code></em>.
    </td>
  </tr>
    <th align=left>
      <code>headers</code>
    </th>
    <td>
      Object
    </td>
    <td>
      Custom headers. Passed headers are merged with defaults:<br>
      <em><code>headers['user-agent']</code> defaults to <code>octokit-rest.js/1.2.3</code> (where <code>1.2.3</code> is the released version)</em>.<br>
      <em><code>headers['accept']</code> defaults to <code>application/vnd.github.v3+json</code>.<br>
    </td>
  </tr>
  <tr>
    <th align=left>
      <code>method</code>
    </th>
    <td>
      String
    </td>
    <td>
      <strong>Required.</strong> Any supported <a href="https://developer.github.com/v3/#http-verbs">http verb</a>, case insensitive. <em>Defaults to <code>Get</code></em>.
    </td>
  </tr>
  <tr>
    <th align=left>
      <code>url</code>
    </th>
    <td>
      String
    </td>
    <td>
      <strong>Required.</strong> A path or full URL which may contain <code>:variable</code> or <code>{variable}</code> placeholders,
      e.g. <code>/orgs/:org/repos</code>. The <code>url</code> is parsed using <a href="https://github.com/bramstein/url-template">url-template</a>.
    </td>
  </tr>
  <tr>
    <th align=left>
      <code>url</code>
    </th>
    <td>
      String
    </td>
    <td>
      <strong>Required.</strong> A path or full URL which may contain <code>:variable</code> or <code>{variable}</code> placeholders,
      e.g. <code>/orgs/:org/repos</code>. The <code>url</code> is parsed using <a href="https://github.com/bramstein/url-template">url-template</a>.
    </td>
  </tr>
  <tr>
    <th align=left>
      <code>data</code>
    </th>
    <td>
      Any
    </td>
    <td>
      Set request body directly instead of setting it to JSON based on additional parameters. See <a href="#data-parameter">"The `data` parameter"</a> below.
    </td>
  </tr>
</table>

All other options will passed depending on the `method` and `url` options.

1. If the option key is a placeholder in the `url`, it will be used as replacement. For example, if the passed options are `{url: '/orgs/:org/repos', org: 'foo'}` the returned `options.url` is `https://api.github.com/orgs/foo/repos`
2. If the `method` is `GET` or `HEAD`, the option is passed as query parameter
3. Otherwise the parameter is passed in the request body as JSON key.

## Result

`octokitRequest` returns a promise and resolves with 3 keys

<table>
  <thead>
    <tr>
      <th align=left>
        key
      </th>
      <th align=left>
        type
      </th>
      <th align=left>
        description
      </th>
    </tr>
  </thead>
  <tr>
    <th align=left><code>headers</code></th>
    <td>Object</td>
    <td>All response headers</td>
  </tr>
  <tr>
    <th align=left><code>code</code></th>
    <td>Integer</td>
    <td>Response status code</td>
  </tr>
  <tr>
    <th align=left><code>redirect</code></th>
    <td>String</td>
    <td>Set to <code>"manual"</code> to extract redirect headers, <code>"error"</code> to reject redirect. Defaults to <code>"follow"</code></td>
  </tr>
  <tr>
    <th align=left><code>data</code></th>
    <td>Any</td>
    <td>The response body as returned from server. If the response is JSON then it will be parsed into an object</td>
  </tr>
  <tr>
    <th align=left><code>agent</code></th>
    <td>Node http(s).Agent</td>
    <td>For advanced request options in node you can pass in a node Agent (<a href="https://nodejs.org/api/http.html#http_class_http_agent">http</a>, <a href="https://nodejs.org/api/https.html#https_class_https_agent">https</a>)</td>
  </tr>
</table>

## `request.defaults()`

Override or set default options. Example:

```js
const myOctokitRequest = require('@octokit/request').defaults({
  baseUrl: 'http://github-enterprise.acme-inc.com/api/v3',
  headers: {
    'user-agent': 'myApp/1.2.3',
    authorization: `token 0000000000000000000000000000000000000001`
  },
  org: 'my-project',
  per_page: 100
})

myOctokitRequest(`GET /orgs/:org/repos`)
```

You can call `.defaults()` again on the returned method, the defaults will cascade.

```js
const myProjectRequest = request.defaults({
  baseUrl: 'http://github-enterprise.acme-inc.com/api/v3',
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
```

`myProjectRequest` now defaults the `baseUrl`, `headers['user-agent']`,
`org` and `headers['authorization']` on top of `headers['accept']` that is set
by the global default.

## Special cases

<a name="data-parameter"></a>
### The `data` parameter – set request body directly

Some endpoints such as [Render a Markdown document in raw mode](https://developer.github.com/v3/markdown/#render-a-markdown-document-in-raw-mode) don’t have parameters that are sent as request body keys, instead the request body needs to be set directly. In these cases, set the `data` parameter.

```js
const options = endpoint('POST /markdown/raw', {
  data: 'Hello world github/linguist#1 **cool**, and #1!',
  headers: {
    accept: 'text/html;charset=utf-8',
    'content-type': 'text/plain'
  }
})

// options is
// {
//   method: 'post',
//   url: 'https://api.github.com/markdown/raw',
//   headers: {
//     accept: 'text/html;charset=utf-8',
//     'content-type': 'text/plain',
//     'user-agent': userAgent
//   },
//   body: 'Hello world github/linguist#1 **cool**, and #1!'
// }
```

### Set parameters for both the URL/query and the request body

There are API endpoints that accept both query parameters as well as a body. In that case you need to add the query parameters as templates to `options.url`, as defined in the [RFC 6570 URI Template specification](https://tools.ietf.org/html/rfc6570).

Example

```js
octokitRequest('POST https://uploads.github.com/repos/octocat/Hello-World/releases/1/assets{?name,label}', {
  name: 'example.zip',
  label: 'short description',
  headers: {
    'content-type': 'text/plain',
    'content-length': 14,
    authorization: `token 0000000000000000000000000000000000000001`
  },
  data: 'Hello, world!'
})
```



## LICENSE

[MIT](LICENSE)
