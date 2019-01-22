import { Response } from 'node-fetch';
export default function getBufferResponse (response) {
  return response.buffer()
}
