import { endpoint } from "@octokit/endpoint";
import getUserAgent from "universal-user-agent";

import { VERSION } from "./version";

const userAgent = `octokit-request.js/${VERSION} ${getUserAgent()}`;
import withDefaults from "./with-defaults";

export const request = withDefaults(endpoint, {
  headers: {
    "user-agent": userAgent
  }
});
