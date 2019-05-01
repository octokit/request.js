import { endpoint } from '@octokit/endpoint'
import getUserAgent from 'universal-user-agent'

import { version } from '../package.json';
const userAgent = `octokit-request.js/${version} ${getUserAgent()}`
import withDefaults from './with-defaults'

export default withDefaults(endpoint, {
  headers: {
    'user-agent': userAgent
  }
})
