import { describe, it, expect } from "vitest";
import { request } from "../src/index.ts";

// separate test file, to ensure that manipulating globalThis.fetch
// has no side effects on other tests
describe("request()", () => {
  it("should error when globalThis.fetch is undefined", async () => {
    expect.assertions(1);

    const originalFetch = globalThis.fetch;
    // @ts-expect-error force undefined to mimic older node version
    globalThis.fetch = undefined;

    try {
      await request("GET /orgs/me");
    } catch (error: any) {
      expect(error.message).toEqual(
        "fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
