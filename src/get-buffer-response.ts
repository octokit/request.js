import type { Response } from "node-fetch";
export default function getBufferResponse(response: Response) {
  return response.arrayBuffer();
}
