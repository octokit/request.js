import { Agent, createServer } from "node:https";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const { request } = require("../../src");
const ca = readFileSync(resolve(__dirname, "./ca.crt"));

describe("custom client certificate", () => {
  let server: any;
  beforeAll((done) => {
    server = createServer(
      {
        key: readFileSync(resolve(__dirname, "./localhost.key")),
        cert: readFileSync(resolve(__dirname, "./localhost.crt")),
      },
      (request: any, response: any) => {
        expect(request.method).toEqual("GET");
        expect(request.url).toEqual("/");

        response.writeHead(200);
        response.write("ok");
        response.end();
      }
    );

    server.listen(0, done);
  });

  it("https.Agent({ca})", () => {
    const agent = new Agent({
      ca,
    });

    return request("/", {
      baseUrl: "https://localhost:" + server.address().port,
      request: { agent },
    });
  });

  it("https.Agent({ca, rejectUnauthorized})", () => {
    const agent = new Agent({
      ca: "invalid",
      rejectUnauthorized: false,
    });

    return request("/", {
      baseUrl: "https://localhost:" + server.address().port,
      request: { agent },
    });
  });

  afterAll((done) => {
    server.close(done);
  });
});
