'use strict'

module.exports = request

const isPlainObject = require('is-plain-object')

const getBuffer = require('./get-buffer-response')
const HttpError = require('./http-error')

function request (fetch, requestOptions) {
  // https://fetch.spec.whatwg.org/#methods
  requestOptions.method = requestOptions.method.toUpperCase()

  // default content-type for JSON
  if (requestOptions.body && !requestOptions.headers['content-type']) {
    requestOptions.headers['content-type'] = 'application/json; charset=utf-8'
  }

  // GitHub expects "content-length: 0" header for PUT/PATCH requests without body
  // fetch does not allow to set `content-length` header, but we can set body to an empty string
  if (['PATCH', 'PUT'].indexOf(requestOptions.method) >= 0 && !requestOptions.body) {
    requestOptions.body = ''
  }

  if (isPlainObject(requestOptions.body) || Array.isArray(requestOptions.body)) {
    requestOptions.body = JSON.stringify(requestOptions.body)
  }

  let headers = {}
  let status

  return fetch(requestOptions.url, {
    method: requestOptions.method,
    body: requestOptions.body,
    headers: requestOptions.headers,
    redirect: requestOptions.redirect,
    timeout: requestOptions.timeout,
    agent: requestOptions.agent
  })

    .then(response => {
      status = response.status

      for (const keyAndValue of response.headers.entries()) {
        headers[keyAndValue[0]] = keyAndValue[1]
      }

      if (status === 204 || status === 205) {
        return
      }

      // GitHub API returns 200 for HEAD requsets
      if (requestOptions.method === 'HEAD') {
        if (status < 400) {
          return
        }

        throw new HttpError(response.statusText, status, headers)
      }

      if (status === 304) {
        requestOptions.url = response.headers.location
        throw new HttpError('Not modified', status, headers)
      }

      if (status >= 400) {
        return response.text()

          .then(message => {
            throw new HttpError(message, status, headers)
          })
      }

      const contentType = response.headers.get('content-type')
      if (/application\/json/.test(contentType)) {
        return response.json()
      }

      if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
        return response.text()
      }

      return getBuffer(response)
    })

    .then(data => {
      return {
        data,
        status,
        headers
      }
    })

    .catch(error => {
      if (error instanceof HttpError) {
        throw error
      }

      throw new HttpError(error.message, 500, headers)
    })
}
