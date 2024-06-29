import type { IncomingMessage } from "http";

export default function bodyParser(request: IncomingMessage) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("error", reject);
    request.on("data", (chunk: string) => (body += chunk));
    request.on("end", () => resolve(body));
  });
}
