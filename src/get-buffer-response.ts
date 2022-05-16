import { Response } from "cross-fetch";
export default function getBufferResponse(response: Response) {
  return response.arrayBuffer();
}
