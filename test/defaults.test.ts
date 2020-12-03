import fetchMock from "fetch-mock";

import { request } from "../src";

describe("endpoint.defaults()", () => {
  it("is a function", () => {
    expect(request.defaults).toBeInstanceOf(Function);
  });

  it("README example", () => {
    const mock = fetchMock
      .sandbox()
      .mock(
        "https://github-enterprise.acme-inc.com/api/v3/orgs/my-project/repos?per_page=100",
        [],
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            authorization: "token 0000000000000000000000000000000000000001",
            "user-agent": "myApp/1.2.3",
          },
        }
      );

    const myRequest = request.defaults({
      baseUrl: "https://github-enterprise.acme-inc.com/api/v3",
      headers: {
        "user-agent": "myApp/1.2.3",
        authorization: `token 0000000000000000000000000000000000000001`,
      },
      org: "my-project",
      per_page: 100,
      request: {
        fetch: mock,
      },
    });

    return myRequest(`GET /orgs/{org}/repos`).then((response) => {
      expect(response.status).toEqual(200);
    });
  });

  it("repeated defaults", () => {
    const mock = fetchMock
      .sandbox()
      .get(
        "https://github-enterprise.acme-inc.com/api/v3/orgs/my-project/repos",
        [],
        {
          headers: {
            accept:
              "application/vnd.github.foo-preview.raw+json,application/vnd.github.bar-preview.raw+json",
            authorization: "token 0000000000000000000000000000000000000001",
            "user-agent": "myApp/1.2.3",
          },
        }
      );

    const myProjectRequest = request.defaults({
      baseUrl: "https://github-enterprise.acme-inc.com/api/v3",
      headers: {
        "user-agent": "myApp/1.2.3",
      },
      mediaType: {
        format: "raw+json",
        previews: ["foo", "bar"],
      },
      org: "my-project",
      request: {
        fetch: mock,
      },
    });
    const myProjectRequestWithAuth = myProjectRequest.defaults({
      headers: {
        authorization: `token 0000000000000000000000000000000000000001`,
      },
    });

    return myProjectRequestWithAuth(`GET /orgs/{org}/repos`).then(
      (response) => {
        expect(response.status).toEqual(200);
      }
    );
  });
});
